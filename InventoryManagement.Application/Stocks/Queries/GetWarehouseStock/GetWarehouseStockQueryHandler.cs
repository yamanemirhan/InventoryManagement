
using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;

public sealed class GetWarehouseStockQueryHandler(IStockReadRepository stockReadRepository) : IRequestHandler<GetWarehouseStockQuery, IReadOnlyList<WarehouseStockItemDto>>
{
    public Task<IReadOnlyList<WarehouseStockItemDto>> Handle(GetWarehouseStockQuery request, CancellationToken cancellationToken)
    {
        return stockReadRepository.GetWarehouseStockAsync(request.WarehouseId, cancellationToken);
    }
}