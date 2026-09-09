using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Stocks.Queries.GetStockOverview;

public sealed class GetStockOverviewQueryHandler(IStockReadRepository repository) : IRequestHandler<GetStockOverviewQuery, IReadOnlyList<StockOverviewDto>>
{
    public Task<IReadOnlyList<StockOverviewDto>> Handle(GetStockOverviewQuery request, CancellationToken cancellationToken) => repository.GetOverviewAsync(cancellationToken);
}
