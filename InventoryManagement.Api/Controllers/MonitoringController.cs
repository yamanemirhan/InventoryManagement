using InventoryManagement.Application.Monitoring;
using InventoryManagement.Application.Monitoring.Commands.RunMonitoringDiagnostic;
using InventoryManagement.Application.Monitoring.Queries.GetMonitoringLogs;
using InventoryManagement.Application.Monitoring.Queries.GetMonitoringOverview;
using InventoryManagement.Application.Monitoring.Queries.GetMonitoringTrace;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController, Route("api/admin/monitoring"), Authorize(Roles = "Admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class MonitoringController(ISender sender) : ControllerBase
{
    [HttpGet]
    public Task<MonitoringOverview> Overview(CancellationToken ct) => sender.Send(new GetMonitoringOverviewQuery(), ct);
    [HttpGet("logs")]
    public Task<IReadOnlyList<MonitoringLog>> Logs([FromQuery] string level = "all", [FromQuery] string? traceId = null, CancellationToken ct = default)
        => sender.Send(new GetMonitoringLogsQuery(level, traceId), ct);
    [HttpGet("traces/{traceId}")]
    public Task<MonitoringTrace> Trace(string traceId, CancellationToken ct) => sender.Send(new GetMonitoringTraceQuery(traceId), ct);
    [HttpPost("diagnostics")]
    public Task<DiagnosticResult> Diagnostic(RunMonitoringDiagnosticCommand command, CancellationToken ct) => sender.Send(command, ct);
}
