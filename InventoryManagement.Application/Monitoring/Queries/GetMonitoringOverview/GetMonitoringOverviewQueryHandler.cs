using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringOverview;

public sealed class GetMonitoringOverviewQueryHandler(IMonitoringReader reader, CompanyAccess access)
    : IRequestHandler<GetMonitoringOverviewQuery, MonitoringOverview>
{
    public Task<MonitoringOverview> Handle(GetMonitoringOverviewQuery request, CancellationToken ct)
    { access.RequirePlatformAdmin(); return reader.OverviewAsync(ct); }
}
