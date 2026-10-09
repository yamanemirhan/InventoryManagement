using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringLogs;

public sealed class GetMonitoringLogsQueryHandler(IMonitoringReader reader, CompanyAccess access)
    : IRequestHandler<GetMonitoringLogsQuery, IReadOnlyList<MonitoringLog>>
{
    public Task<IReadOnlyList<MonitoringLog>> Handle(GetMonitoringLogsQuery request, CancellationToken ct)
    { access.RequirePlatformAdmin(); return reader.LogsAsync(request.Level, request.TraceId, ct); }
}
