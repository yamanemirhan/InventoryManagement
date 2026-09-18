using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Reports.Queries.GetStockReport;

public sealed class GetStockReportQueryHandler(IInventoryReportRepository repository) : IRequestHandler<GetStockReportQuery, PagedResult<StockReportRow>>
{ public Task<PagedResult<StockReportRow>> Handle(GetStockReportQuery query, CancellationToken ct) => repository.GetStockReportAsync(query, ct); }
