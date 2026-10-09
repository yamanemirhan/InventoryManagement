using System.Diagnostics;
using System.Diagnostics.Metrics;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Telemetry;
using InventoryManagement.Application.Monitoring;
using InventoryManagement.Infrastructure.Persistence;

namespace InventoryManagement.Api.Common.Operations;

public sealed class MonitoringDiagnostics(IServiceScopeFactory scopes, IConfiguration config, ILogger<MonitoringDiagnostics> logger) : IMonitoringDiagnostics
{
    private readonly SemaphoreSlim gate = new(1, 1);
    private DateTimeOffset lastRun;
    private static readonly Counter<long> Runs = InventoryTelemetry.Meter.CreateCounter<long>("inventory.diagnostic.runs");

    public async Task<DiagnosticResult> RunAsync(string scenario, CancellationToken ct)
    {
        if (!config.GetValue<bool>("Observability:DiagnosticsEnabled")) throw new ForbiddenException();
        if (!await gate.WaitAsync(0, ct)) throw new InvalidOperationException("A diagnostic is already running.");
        try
        {
            if (DateTimeOffset.UtcNow - lastRun < TimeSpan.FromMinutes(1)) throw new InvalidOperationException("Wait one minute between diagnostics.");
            lastRun = DateTimeOffset.UtcNow;
            var trace = Activity.Current?.TraceId.ToString() ?? ActivityTraceId.CreateRandom().ToString();
            // Only this request is affected. No stopped services, changed credentials or business writes.
            using (var fault = InventoryTelemetry.Activities.StartActivity("diagnostic.simulated_dependency"))
            {
                fault?.SetTag("inventory.diagnostic", true);
                if (scenario == "slow_dependency") await Task.Delay(750, ct);
                else
                {
                    fault?.SetStatus(ActivityStatusCode.Error);
                    fault?.SetTag("error.type", "SimulatedDependencyTimeout");
                    logger.LogError("DIAGNOSTIC simulated dependency timeout; Scenario {Scenario}; TraceId {TraceId}. Retrying with the healthy connection.", scenario, trace);
                }
            }
            using var retry = InventoryTelemetry.Activities.StartActivity("diagnostic.healthy_dependency");
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var healthy = await db.Database.CanConnectAsync(timeout.Token);
            Runs.Add(1, new TagList { { "scenario", scenario }, { "outcome", healthy ? "recovered" : "unhealthy" } });
            if (!healthy) throw new InvalidOperationException("The real dependency check failed; inspect readiness.");
            logger.LogInformation("DIAGNOSTIC recovered; Scenario {Scenario}; TraceId {TraceId}. The real database connection is healthy.", scenario, trace);
            return new(scenario, trace, "recovered", DateTimeOffset.UtcNow);
        }
        finally { gate.Release(); }
    }
}
