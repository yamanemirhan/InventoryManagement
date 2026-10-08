namespace InventoryManagement.Application.Imports;

// Strings preserve invalid spreadsheet values for useful row/column error reports.
public sealed record ImportRow(string? Name = null, string? Sku = null, string? Location = null,
    string? Email = null, string? WarehouseName = null, string? Quantity = null,
    string? MinimumQuantity = null, string? OrderKey = null, string? SupplierEmail = null, string? UnitPrice = null);
