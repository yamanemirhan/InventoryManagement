using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Reports.Queries.GetCountReport;

public sealed record GetCountReportQuery(Guid? WarehouseId = null, string? Search = null, DateTime? From = null, DateTime? To = null, int Page = 1, int PageSize = 50) : IRequest<PagedResult<CountReportRow>>;
