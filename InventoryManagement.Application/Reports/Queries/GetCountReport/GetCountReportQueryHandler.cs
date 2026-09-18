using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Reports.Queries.GetCountReport;

public sealed class GetCountReportQueryHandler(IInventoryReportRepository repository) : IRequestHandler<GetCountReportQuery, PagedResult<CountReportRow>>
{ public Task<PagedResult<CountReportRow>> Handle(GetCountReportQuery query, CancellationToken ct) => repository.GetCountReportAsync(query, ct); }
