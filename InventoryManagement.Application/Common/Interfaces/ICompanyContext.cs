namespace InventoryManagement.Application.Common.Interfaces;

public interface ICompanyContext
{
    Guid CompanyId { get; }
    string Role => "";
}
