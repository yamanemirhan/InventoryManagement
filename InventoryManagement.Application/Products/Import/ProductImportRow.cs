namespace InventoryManagement.Application.Products.Import;

public sealed record ProductImportRow(string Name, string Sku);
public sealed record ProductImportPreview(int RowCount, IReadOnlyList<string> Errors);
