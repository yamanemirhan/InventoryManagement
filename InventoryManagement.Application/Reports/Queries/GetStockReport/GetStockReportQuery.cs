using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Reports.Queries.GetStockReport;

public sealed record GetStockReportQuery(Guid? WarehouseId = null, string? Search = null, bool LowOnly = false, int Page = 1, int PageSize = 50) : IRequest<PagedResult<StockReportRow>>;
