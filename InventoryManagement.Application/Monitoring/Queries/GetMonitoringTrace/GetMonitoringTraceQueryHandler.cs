using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringTrace;

public sealed class GetMonitoringTraceQueryHandler(IMonitoringReader reader, CompanyAccess access)
    : IRequestHandler<GetMonitoringTraceQuery, MonitoringTrace>
{
    public Task<MonitoringTrace> Handle(GetMonitoringTraceQuery request, CancellationToken ct)
    { access.RequirePlatformAdmin(); return reader.TraceAsync(request.TraceId, ct); }
}
