using System.Data;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Imports;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using static InventoryManagement.Application.Imports.ImportRules;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class BulkImportRepository(AppDbContext db, ICurrentUser user) : IBulkImportRepository
{
    private sealed record References(Dictionary<string, Product> Products, Dictionary<string, Warehouse[]> Warehouses, Dictionary<string, Supplier> Suppliers);
    private static string Fingerprint(string kind, IReadOnlyList<ImportRow> rows)
    {
        // Canonical, order-independent fingerprint also catches a reordered retry.
        static string QuantityText(string? value) => Integer(value, out var parsed) ? parsed.ToString(CultureInfo.InvariantCulture) : Text(value);
        static string PriceText(string? value) => Price(value, out var parsed) ? parsed.ToString("G29", CultureInfo.InvariantCulture) : Text(value);
        var values = rows.Select(r => kind switch {
            // Retain existing receipt hashes for files without a barcode column.
            "products" => string.IsNullOrWhiteSpace(r.Barcode) ? new[] { Text(r.Name), Text(r.Sku) } : new[] { Text(r.Name), Text(r.Sku), Text(r.Barcode) },
            "warehouses" => new[] { Text(r.Name), Text(r.Location) },
            "suppliers" => new[] { Text(r.Name), Text(r.Email).ToLowerInvariant() },
            "stocks" => new[] { Text(r.Sku), Text(r.WarehouseName), QuantityText(r.Quantity), QuantityText(r.MinimumQuantity) },
            _ => new[] { Text(r.OrderKey), Text(r.SupplierEmail).ToLowerInvariant(), Text(r.WarehouseName), Text(r.Sku), QuantityText(r.Quantity), PriceText(r.UnitPrice) }
        }).Select(v => JsonSerializer.Serialize(v)).Order(StringComparer.Ordinal);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(kind + "\n" + string.Join("\n", values))));
    }
    public async Task<ImportPreview> PreviewAsync(string kind, IReadOnlyList<ImportRow> rows, CancellationToken ct)
    {
        if (await db.ImportBatches.AnyAsync(x => x.Fingerprint == Fingerprint(kind, rows), ct)) return new(rows.Count, [], true);
        var (errors, _) = await ValidateAsync(kind, rows, ct);
        return new(rows.Count, errors);
    }
    private async Task<(List<ImportError> Errors, References Refs)> ValidateAsync(string kind, IReadOnlyList<ImportRow> rows, CancellationToken ct)
    {
        var errors = ImportRowValidation.Check(kind, rows);
        void Error(int i, string column, string message) => errors.Add(new(i + 2, column, message));
        var refs = new References(new(StringComparer.Ordinal), new(StringComparer.Ordinal), new(StringComparer.Ordinal));
        if (errors.Count > 0) return (errors, refs);
        var skus = rows.Select(r => Text(r.Sku)).Distinct().ToArray();
        var names = rows.Select(r => kind == "warehouses" ? Text(r.Name) : Text(r.WarehouseName)).Distinct().ToArray();
        var emails = rows.Select(r => Text(kind == "suppliers" ? r.Email : r.SupplierEmail).ToLowerInvariant()).Distinct().ToArray();
        if (kind == "products")
        {
            var codes = rows.SelectMany(r => new[] { Text(r.Sku), Text(r.Barcode) }).Where(x => x.Length > 0).SelectMany(BarcodeRules.Variants).Distinct().ToArray();
            refs = refs with { Products = await db.Products.Where(x => codes.Contains(x.SKU) || (x.Barcode != null && codes.Contains(x.Barcode))).ToDictionaryAsync(x => x.SKU, ct) };
        }
        if (kind is "stocks" or "purchase-orders")
            refs = refs with { Products = await db.Products.Where(x => skus.Contains(x.SKU)).ToDictionaryAsync(x => x.SKU, ct) };
        if (kind is "warehouses" or "stocks" or "purchase-orders")
            refs = refs with { Warehouses = (await db.Warehouses.Where(x => names.Contains(x.Name)).ToListAsync(ct)).GroupBy(x => x.Name).ToDictionary(g => g.Key, g => g.ToArray(), StringComparer.Ordinal) };
        if (kind is "suppliers" or "purchase-orders")
            refs = refs with { Suppliers = await db.Suppliers.Where(x => emails.Contains(x.Email)).ToDictionaryAsync(x => x.Email, ct) };
        var existingStocks = new HashSet<(Guid, Guid)>();
        var existingCodes = refs.Products.Values.SelectMany(x => new[] { x.SKU, x.Barcode ?? "" }).Where(x => x.Length > 0).SelectMany(BarcodeRules.Variants).ToHashSet(StringComparer.Ordinal);
        if (kind == "stocks")
        {
            var productIds = refs.Products.Values.Select(x => x.Id).ToArray(); var warehouseIds = refs.Warehouses.Values.SelectMany(x => x).Select(x => x.Id).ToArray();
            var stocks = await db.Stocks.Where(x => productIds.Contains(x.ProductId) && warehouseIds.Contains(x.WarehouseId))
                .Select(x => new { x.ProductId, x.WarehouseId }).Take(10001).ToListAsync(ct);
            if (stocks.Count > 10000) { Error(0, "Record", "Split this import into smaller warehouse batches."); return (errors, refs); }
            existingStocks = stocks.Select(x => (x.ProductId, x.WarehouseId)).ToHashSet();
        }
        for (var i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            if (kind == "products")
            {
                if (BarcodeRules.Variants(Text(r.Sku)).Any(existingCodes.Contains)) Error(i, "Sku", "SKU or barcode already exists, including archived products.");
                if (!string.IsNullOrWhiteSpace(r.Barcode) && BarcodeRules.Variants(Text(r.Barcode)).Any(existingCodes.Contains)) Error(i, "Barcode", "Barcode or SKU already exists, including archived products.");
            }
            if (kind == "warehouses" && refs.Warehouses.ContainsKey(Text(r.Name))) Error(i, "Name", "Warehouse name already exists.");
            if (kind == "suppliers" && refs.Suppliers.ContainsKey(Text(r.Email).ToLowerInvariant())) Error(i, "Email", "Supplier email already exists.");
            if (kind is "stocks" or "purchase-orders")
            {
                if (!refs.Products.TryGetValue(Text(r.Sku), out var product) || product.IsDeleted) Error(i, "Sku", "Active product not found in this company.");
                if (!refs.Warehouses.TryGetValue(Text(r.WarehouseName), out var warehouses) || warehouses.Length != 1) Error(i, "WarehouseName", "Warehouse not found or name is ambiguous in this company.");
                if (kind == "stocks" && product is not null && warehouses?.Length == 1 && existingStocks.Contains((product.Id, warehouses[0].Id))) Error(i, "Quantity", "Stock already exists. Opening imports cannot overwrite or increase existing stock; use stock movements or counts.");
            }
            if (kind == "purchase-orders" && !refs.Suppliers.ContainsKey(Text(r.SupplierEmail).ToLowerInvariant())) Error(i, "SupplierEmail", "Supplier not found in this company.");
        }
        return (errors, refs);
    }
    public async Task<ImportResult> ImportAsync(string kind, IReadOnlyList<ImportRow> rows, CancellationToken ct)
    {
        var fingerprint = Fingerprint(kind, rows);
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var previous = await db.ImportBatches.SingleOrDefaultAsync(x => x.Fingerprint == fingerprint, ct);
            if (previous is not null) return new(previous.Records, true);
            var (errors, refs) = await ValidateAsync(kind, rows, ct);
            if (errors.Count > 0) throw new DomainException(string.Join("; ", errors.Take(10).Select(e => $"Row {e.Row}, {e.Column}: {e.Message}")));
            var records = rows.Count;
            foreach (var r in rows)
            {
                if (kind == "products") db.Products.Add(new Product(Text(r.Name), Text(r.Sku), Text(r.Barcode)));
                if (kind == "warehouses") db.Warehouses.Add(new Warehouse(Text(r.Name), Text(r.Location)));
                if (kind == "suppliers") db.Suppliers.Add(new Supplier(Text(r.Name), Text(r.Email)));
                if (kind == "stocks")
                {
                    var product = refs.Products[Text(r.Sku)]; var warehouse = refs.Warehouses[Text(r.WarehouseName)][0];
                    var stock = new Stock(product.Id, warehouse.Id); Integer(r.Quantity, out var qty); Integer(r.MinimumQuantity, out var minimum);
                    stock.SetMinimum(minimum); if (qty > 0) { stock.Increase(qty); db.StockMovements.Add(new StockMovement(product.Id, warehouse.Id, StockMovementType.In, qty).Annotate("Opening stock import", qty)); }
                    db.Stocks.Add(stock);
                }
            }
            if (kind == "purchase-orders")
            {
                var groups = rows.GroupBy(r => Text(r.OrderKey)).ToArray(); records = groups.Length;
                foreach (var group in groups)
                {
                    var first = group.First(); var order = new PurchaseOrder(refs.Suppliers[Text(first.SupplierEmail).ToLowerInvariant()].Id, refs.Warehouses[Text(first.WarehouseName)][0].Id);
                    foreach (var r in group) { Integer(r.Quantity, out var qty); Price(r.UnitPrice, out var price); order.AddItem(refs.Products[Text(r.Sku)].Id, qty, price); }
                    db.PurchaseOrders.Add(order);
                }
            }
            db.ImportBatches.Add(new ImportBatch(kind, fingerprint, records, user.SubjectId));
            await db.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
            return new(records, false);
        }
        catch (Exception ex) when (ex.GetBaseException() is PostgresException { SqlState: PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(ct); db.ClearChanges();
            // A simultaneous upload may have committed this exact batch while ours aborted.
            var completed = await db.ImportBatches.AsNoTracking().SingleOrDefaultAsync(x => x.Fingerprint == fingerprint, ct);
            if (completed is not null) return new(completed.Records, true);
            throw new ConcurrencyException("Inventory changed during import. Preview the file again and retry.", ex);
        }
    }
}
