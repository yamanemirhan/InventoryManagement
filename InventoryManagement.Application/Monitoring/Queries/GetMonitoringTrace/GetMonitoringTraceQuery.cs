using InventoryManagement.Application.Companies.Common;
using FluentValidation;
using MediatR;

namespace InventoryManagement.Application.Monitoring.Queries.GetMonitoringTrace;

public sealed record GetMonitoringTraceQuery(string TraceId) : IRequest<MonitoringTrace>;
