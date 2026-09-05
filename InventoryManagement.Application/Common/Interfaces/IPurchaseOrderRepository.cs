using InventoryManagement.Domain.Entities;
namespace InventoryManagement.Application.Common.Interfaces;
public interface IPurchaseOrderRepository
{
    Task AddAsync(PurchaseOrder order, CancellationToken cancellationToken);
    Task<PurchaseOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
