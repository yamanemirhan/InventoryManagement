
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public class Product : Entity
{
    private Product() { } // Private constructor for EF Core

    public Product(string name, string sku)
    {
        Name = name;
        SKU = sku;
    }

    public string Name { get; private set; } = null!;
    public string SKU { get; private set; } = null!;
    public bool IsDeleted { get; private set; }

    public void SoftDelete()
    {
        IsDeleted = true;
    }
}