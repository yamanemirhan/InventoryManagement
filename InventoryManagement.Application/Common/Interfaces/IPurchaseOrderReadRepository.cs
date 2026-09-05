using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.PurchaseOrders.Queries;
namespace InventoryManagement.Application.Common.Interfaces;
public interface IPurchaseOrderReadRepository
{
    Task<PagedResult<PurchaseOrderListItemDto>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<PurchaseOrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
