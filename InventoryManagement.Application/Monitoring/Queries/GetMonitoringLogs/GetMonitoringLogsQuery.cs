using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringLogs;

public sealed record GetMonitoringLogsQuery(string Level = "all", string? TraceId = null) : IRequest<IReadOnlyList<MonitoringLog>>;
