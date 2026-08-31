
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public class Supplier : Entity
{
    private Supplier() { }

    public Supplier(string name, string email)
    {
        Name = name;
        Email = email;
    }

    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
}