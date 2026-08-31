
namespace InventoryManagement.Domain.Common;

// this is base class for all entities in the domain layer,
// it contains a unique identifier for each entity
public abstract class  Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
