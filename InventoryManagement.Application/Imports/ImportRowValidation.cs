using System.Text.Json;
using static InventoryManagement.Application.Imports.ImportRules;
namespace InventoryManagement.Application.Imports;

public static class ImportRowValidation
{
    public static List<ImportError> Check(string kind, IReadOnlyList<ImportRow> rows)
    {
        var errors = new List<ImportError>(); var seen = new HashSet<string>(StringComparer.Ordinal);
        void Error(int i, string column, string message) => errors.Add(new(i + 2, column, message));
        void Required(int i, string column, string? text, int max)
        { if (string.IsNullOrWhiteSpace(text) || Text(text).Length > max) Error(i, column, $"Required, maximum {max} characters."); }
        for (var i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            if (kind is "products" or "warehouses" or "suppliers") Required(i, "Name", r.Name, kind == "warehouses" ? 150 : 200);
            if (kind == "warehouses") Required(i, "Location", r.Location, 300);
            if (kind is "products" or "stocks" or "purchase-orders") Required(i, "Sku", r.Sku, 100);
            if (kind == "suppliers" && (!ValidEmail(r.Email) || Text(r.Email).Length > 320)) Error(i, "Email", "A valid email address is required.");
            if (kind is "stocks" or "purchase-orders")
            {
                Required(i, "WarehouseName", r.WarehouseName, 150);
                if (!Integer(r.Quantity, out var qty) || (kind == "purchase-orders" && qty == 0)) Error(i, "Quantity", kind == "stocks" ? "Use a whole number from 0 to 2147483647." : "Use a whole number from 1 to 2147483647.");
            }
            if (kind == "stocks" && !Integer(r.MinimumQuantity, out _)) Error(i, "MinimumQuantity", "Use a whole number from 0 to 2147483647.");
            if (kind == "purchase-orders")
            {
                Required(i, "OrderKey", r.OrderKey, 100);
                if (!ValidEmail(r.SupplierEmail) || Text(r.SupplierEmail).Length > 320) Error(i, "SupplierEmail", "A valid supplier email is required.");
                if (!Price(r.UnitPrice, out _)) Error(i, "UnitPrice", "Use a nonnegative price, dot decimal separator and at most 2 decimal places.");
            }
            var key = kind switch {
                "products" => Text(r.Sku), "warehouses" => Text(r.Name), "suppliers" => Text(r.Email).ToLowerInvariant(),
                "stocks" => JsonSerializer.Serialize(new[] { Text(r.Sku), Text(r.WarehouseName) }),
                _ => JsonSerializer.Serialize(new[] { Text(r.OrderKey), Text(r.Sku) }) };
            if (!seen.Add(key)) Error(i, kind == "purchase-orders" ? "OrderKey / Sku" : "Record", "Duplicate record in file.");
        }
        if (kind == "purchase-orders") foreach (var group in rows.Select((r, i) => (r, i)).GroupBy(x => Text(x.r.OrderKey)))
        {
            if (group.Count() > 100) Error(group.First().i, "OrderKey", "Maximum 100 lines per order.");
            if (group.Select(x => (Text(x.r.SupplierEmail).ToLowerInvariant(), Text(x.r.WarehouseName))).Distinct().Count() != 1)
                Error(group.First().i, "OrderKey", "All lines of an order must use the same supplier and warehouse.");
        }
        return errors;
    }
}
