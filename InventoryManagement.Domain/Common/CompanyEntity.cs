namespace InventoryManagement.Domain.Common;

public abstract class CompanyEntity : Entity
{
    public Guid CompanyId { get; private set; }
}
