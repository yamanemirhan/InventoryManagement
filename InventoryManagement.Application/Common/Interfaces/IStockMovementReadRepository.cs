using InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockMovementReadRepository
{
    Task<InventoryManagement.Application.Common.Models.PagedResult<StockMovementDto>> GetPageAsync(Guid warehouseId, int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyList<StockMovementDto>> GetHistoryAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default);
}
