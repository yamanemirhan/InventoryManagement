
using MediatR;

namespace InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;

public sealed record GetWarehouseStockQuery(Guid WarehouseId) : IRequest<IReadOnlyList<WarehouseStockItemDto>>;