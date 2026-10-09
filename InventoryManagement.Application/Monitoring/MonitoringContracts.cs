namespace InventoryManagement.Application.Monitoring;

public sealed record MetricValue(string Name, double? Value, string Unit);
public sealed record MetricPoint(double Timestamp, double Value);
public sealed record MetricSeries(string Name, IReadOnlyList<MetricPoint> Points);
public sealed record ContainerMetric(string Name, double? CpuPercent, double? MemoryBytes, double? MemoryLimitBytes, bool Healthy);
public sealed record MonitoringAlert(string Name, string State, string Severity, string Summary);
public sealed record MonitoringOverview(DateTimeOffset CollectedAtUtc, string Environment,
    IReadOnlyList<MetricValue> Metrics, IReadOnlyList<MetricSeries> Series, IReadOnlyList<ContainerMetric> Containers,
    IReadOnlyList<MonitoringAlert> Alerts, string GrafanaPath, bool DiagnosticsEnabled);
public sealed record MonitoringLog(DateTimeOffset Timestamp, string Level, string Message, string? TraceId);
public sealed record TraceSpan(string Name, string Service, double DurationMs, bool Error);
public sealed record MonitoringTrace(string TraceId, IReadOnlyList<TraceSpan> Spans);
public sealed record DiagnosticResult(string Scenario, string TraceId, string Outcome, DateTimeOffset CompletedAtUtc);

public interface IMonitoringReader
{
    Task<MonitoringOverview> OverviewAsync(CancellationToken ct);
    Task<IReadOnlyList<MonitoringLog>> LogsAsync(string level, string? traceId, CancellationToken ct);
    Task<MonitoringTrace> TraceAsync(string traceId, CancellationToken ct);
}

public interface IMonitoringDiagnostics
{
    Task<DiagnosticResult> RunAsync(string scenario, CancellationToken ct);
}
