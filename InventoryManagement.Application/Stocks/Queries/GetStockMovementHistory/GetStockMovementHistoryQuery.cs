
using MediatR;

namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed record GetStockMovementHistoryQuery(Guid WarehouseId) : IRequest<IReadOnlyList<StockMovementDto>>;