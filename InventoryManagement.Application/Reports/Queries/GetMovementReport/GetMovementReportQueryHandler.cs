using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Reports.Queries.GetMovementReport;

public sealed class GetMovementReportQueryHandler(IInventoryReportRepository repository) : IRequestHandler<GetMovementReportQuery, PagedResult<MovementReportRow>>
{ public Task<PagedResult<MovementReportRow>> Handle(GetMovementReportQuery query, CancellationToken ct) => repository.GetMovementReportAsync(query, ct); }
