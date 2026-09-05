using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using MediatR;
namespace InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;

public sealed class GetStockMovementHistoryPageQueryHandler(IStockMovementReadRepository repository) : IRequestHandler<GetStockMovementHistoryPageQuery, PagedResult<StockMovementDto>>
{
    public Task<PagedResult<StockMovementDto>> Handle(GetStockMovementHistoryPageQuery request, CancellationToken ct) =>
        repository.GetPageAsync(request.WarehouseId, request.Page, request.PageSize, ct);
}
