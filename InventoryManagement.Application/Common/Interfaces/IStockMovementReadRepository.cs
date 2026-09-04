using InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockMovementReadRepository
{
    Task<IReadOnlyList<StockMovementDto>> GetHistoryAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default);
}