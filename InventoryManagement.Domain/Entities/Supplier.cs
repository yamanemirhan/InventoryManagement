
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public class Supplier : CompanyEntity
{
    private Supplier() { }

    public Supplier(string name, string email)
    {
        Name = name.Trim();
        Email = email.Trim().ToLowerInvariant();
    }

    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
}
