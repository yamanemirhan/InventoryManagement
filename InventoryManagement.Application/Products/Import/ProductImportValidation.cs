using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Common;
namespace InventoryManagement.Application.Products.Import;

public sealed class ProductImportValidation(IProductImportRepository repository)
{
    public async Task<ProductImportPreview> CheckAsync(IReadOnlyList<ProductImportRow>? rows, CancellationToken ct)
    {
        if (rows is null || rows.Count is < 1 or > 1000) return new(rows?.Count ?? 0, ["Provide between 1 and 1000 product rows."]);
        var errors = new List<string>(); var seen = new HashSet<string>(StringComparer.Ordinal);
        var codes = new Dictionary<string, int>(StringComparer.Ordinal);
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            if (row is null || string.IsNullOrWhiteSpace(row.Name) || row.Name.Trim().Length > 200 || string.IsNullOrWhiteSpace(row.Sku) || row.Sku.Trim().Length > 100) { errors.Add($"Row {i + 2}: Name (1-200) and Sku (1-100) are required."); continue; }
            if (!seen.Add(row.Sku.Trim())) errors.Add($"Row {i + 2}: duplicate SKU in file.");
            if (!BarcodeRules.IsValid(row.Barcode?.Trim())) errors.Add($"Row {i + 2}: invalid Barcode (maximum 100 ASCII characters, no spaces or inventory: prefix).");
            foreach (var code in new[] { row.Sku.Trim(), row.Barcode?.Trim() ?? "" }.Where(x => x.Length > 0).SelectMany(BarcodeRules.Variants).Distinct())
                if (codes.TryGetValue(code, out var previous) && previous != i) errors.Add($"Row {i + 2}: code belongs to another product row.");
                else codes[code] = i;
        }
        foreach (var sku in await repository.ExistingSkusAsync(codes.Keys.ToArray(), ct)) errors.Add($"SKU or barcode already exists: {sku}");
        return new(rows.Count, errors);
    }
}
