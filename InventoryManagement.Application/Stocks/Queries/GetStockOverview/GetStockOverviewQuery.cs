using MediatR;
namespace InventoryManagement.Application.Stocks.Queries.GetStockOverview;

public sealed record GetStockOverviewQuery : IRequest<IReadOnlyList<StockOverviewDto>>;
