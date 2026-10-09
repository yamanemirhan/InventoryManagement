using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringOverview;

public sealed record GetMonitoringOverviewQuery : IRequest<MonitoringOverview>;
