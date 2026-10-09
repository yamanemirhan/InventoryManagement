
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public class Product : CompanyEntity
{
    private Product() { } // Private constructor for EF Core

    public Product(string name, string sku, string? barcode = null)
    {
        Name = name.Trim();
        SKU = sku.Trim();
        SetBarcode(barcode);
    }

    public string Name { get; private set; } = null!;
    public string SKU { get; private set; } = null!;
    public string? Barcode { get; private set; }
    public bool IsDeleted { get; private set; }

    public void SoftDelete()
    {
        IsDeleted = true;
    }
    public void Update(string name, string sku)
    {
        Name = name.Trim();
        SKU = sku.Trim();
    }
    public void SetBarcode(string? barcode)
    {
        var value = barcode?.Trim();
        if (!InventoryManagement.Domain.Common.BarcodeRules.IsValid(value))
            throw new InventoryManagement.Domain.Exceptions.DomainException("Barcode must contain at most 100 printable ASCII characters and cannot use the inventory: prefix.");
        Barcode = string.IsNullOrEmpty(value) ? null : value;
    }
}
