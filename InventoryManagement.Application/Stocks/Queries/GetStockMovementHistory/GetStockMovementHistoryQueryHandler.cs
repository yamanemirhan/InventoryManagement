using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed class GetStockMovementHistoryQueryHandler(IStockMovementReadRepository repository)
    : IRequestHandler<GetStockMovementHistoryQuery, IReadOnlyList<StockMovementDto>>
{
    public Task<IReadOnlyList<StockMovementDto>> Handle(
        GetStockMovementHistoryQuery request,
        CancellationToken cancellationToken)
    {
        return repository.GetHistoryAsync(request.WarehouseId, cancellationToken);
    }
}