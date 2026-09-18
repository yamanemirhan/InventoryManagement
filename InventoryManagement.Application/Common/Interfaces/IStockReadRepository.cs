using InventoryManagement.Application.Stocks.Queries.GetStockOverview;
﻿
using InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockReadRepository
{
    Task<IReadOnlyList<StockOverviewDto>> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WarehouseStockItemDto>> GetWarehouseStockAsync(Guid warehouseId, CancellationToken cancellationToken = default);
}
