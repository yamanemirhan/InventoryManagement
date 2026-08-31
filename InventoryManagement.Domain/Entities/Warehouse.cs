
using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public class Warehouse : Entity
{
    private Warehouse() { }

    public Warehouse(string name, string location)
    {
        Name = name;
        Location = location;
    }

    public string Name { get; private set; } = null!;
    public string Location { get; private set; } = null!;
}
