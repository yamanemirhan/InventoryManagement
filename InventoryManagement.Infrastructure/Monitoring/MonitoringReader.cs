using System.Globalization;
using System.Text.Json;
using InventoryManagement.Application.Monitoring;
using Microsoft.Extensions.Configuration;

namespace InventoryManagement.Infrastructure.Monitoring;

public sealed class MonitoringReader(IHttpClientFactory clients, IConfiguration configuration) : IMonitoringReader
{
    private string EnvironmentName => configuration["Observability:Environment"] ?? "development";
    private string EnvironmentSelector => "environment=\"" + (EnvironmentName is "staging" or "production" ? EnvironmentName : "development") + "\"";
    private async Task<JsonDocument> Read(string backend, string path, CancellationToken ct)
    {
        var baseUrl = configuration[$"Observability:{backend}Url"];
        if (string.IsNullOrWhiteSpace(baseUrl)) throw new InvalidOperationException("Monitoring is not configured for this environment.");
        using var response = await clients.CreateClient("monitoring").GetAsync(baseUrl.TrimEnd('/') + path, HttpCompletionOption.ResponseHeadersRead, ct);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) throw new KeyNotFoundException("Trace not found. Allow a few seconds for export or check the retention window.");
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Monitoring backend is unavailable. Check collector health.");
        // Fixed queries, limits and bounded response sizes prevent an admin request from exhausting memory.
        if (response.Content.Headers.ContentLength > 2_000_000) throw new InvalidOperationException("Monitoring response is too large.");
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var output = new MemoryStream(); var buffer = new byte[8192]; int count;
        while ((count = await stream.ReadAsync(buffer, ct)) > 0)
        { if (output.Length + count > 2_000_000) throw new InvalidOperationException("Monitoring response is too large."); await output.WriteAsync(buffer.AsMemory(0, count), ct); }
        return JsonDocument.Parse(output.ToArray());
    }
    private async Task<double?> Value(string query, CancellationToken ct)
    {
        using var json = await Read("Prometheus", "/api/v1/query?query=" + Uri.EscapeDataString(query), ct);
        var result = json.RootElement.GetProperty("data").GetProperty("result");
        return result.GetArrayLength() > 0 && double.TryParse(result[0].GetProperty("value")[1].GetString(), CultureInfo.InvariantCulture, out var value) && double.IsFinite(value) ? value : null;
    }
    public async Task<MonitoringOverview> OverviewAsync(CancellationToken ct)
    {
        var e = EnvironmentSelector;
        var queries = new (string Name, string Query, string Unit)[] {
            ("cpu", "100 * (1 - avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])))", "%"),
            ("memory", "100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)", "%"),
            ("memoryTotal", "node_memory_MemTotal_bytes", "bytes"),
            ("disk", "100 * (1 - node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"})", "%"),
            ("networkReceive", "sum(rate(inventory_host_network_receive_bytes_total{device!~\"lo|veth.*|docker.*|br-.*\"}[5m]))", "bytes/s"),
            ("networkTransmit", "sum(rate(inventory_host_network_transmit_bytes_total{device!~\"lo|veth.*|docker.*|br-.*\"}[5m]))", "bytes/s"),
            ("uptime", "time() - node_boot_time_seconds", "s"),
            ("requests", $"sum(rate(inventory_http_requests_total{{{e}}}[5m]))", "/s"),
            ("errors", $"100 * (sum(rate(inventory_http_requests_total{{{e},status=~\"5..\"}}[5m])) or vector(0)) / clamp_min(sum(rate(inventory_http_requests_total{{{e}}}[5m])), 0.001)", "%"),
            ("latencyP95", $"histogram_quantile(0.95, sum by(le)(rate(inventory_http_duration_seconds_bucket{{{e}}}[5m])))", "s"),
            ("realtimePending", $"inventory_outbox_pending{{{e}}}", "count"),
            ("realtimeOldest", $"inventory_outbox_oldest_seconds{{{e}}}", "s"),
            ("emailPending", $"inventory_email_pending{{{e}}}", "count"),
            ("emailRetried", $"inventory_email_retried{{{e}}}", "count"),
            ("lowStock", $"inventory_stock_low{{{e}}}", "count"),
            ("businessCollector", $"inventory_business_collector_healthy{{{e}}}", "boolean") };
        var values = await Task.WhenAll(queries.Select(async q => new MetricValue(q.Name, await Value(q.Query, ct), q.Unit)));
        var end = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var series = new List<MetricSeries>();
        foreach (var q in queries.Where(x => x.Name is "cpu" or "memory" or "requests" or "latencyP95"))
        {
            using var json = await Read("Prometheus", $"/api/v1/query_range?query={Uri.EscapeDataString(q.Query)}&start={end - 900}&end={end}&step=30", ct);
            var data = json.RootElement.GetProperty("data").GetProperty("result");
            var points = new List<MetricPoint>();
            if (data.GetArrayLength() > 0) foreach (var v in data[0].GetProperty("values").EnumerateArray())
                if (double.TryParse(v[1].GetString(), CultureInfo.InvariantCulture, out var value) && double.IsFinite(value)) points.Add(new(v[0].GetDouble(), value));
            series.Add(new(q.Name, points));
        }
        using var containersJson = await Read("Prometheus", "/api/v1/query?query=" + Uri.EscapeDataString("inventory_container_memory_bytes"), ct);
        var containers = new List<ContainerMetric>();
        foreach (var item in containersJson.RootElement.GetProperty("data").GetProperty("result").EnumerateArray())
        {
            var name = item.GetProperty("metric").GetProperty("container").GetString()!;
            // Labels originate from the trusted host collector, never request parameters.
            var selector = "container=\"" + name.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
            containers.Add(new(name, await Value("inventory_container_cpu_percent{" + selector + "}", ct),
                double.Parse(item.GetProperty("value")[1].GetString()!, CultureInfo.InvariantCulture),
                await Value("inventory_container_memory_limit_bytes{" + selector + "}", ct),
                await Value("inventory_container_healthy{" + selector + "}", ct) == 1));
        }
        using var alertsJson = await Read("Prometheus", "/api/v1/alerts", ct);
        var alerts = alertsJson.RootElement.GetProperty("data").GetProperty("alerts").EnumerateArray().Select(a =>
            new MonitoringAlert(a.GetProperty("labels").GetProperty("alertname").GetString()!, a.GetProperty("state").GetString()!,
                a.GetProperty("labels").TryGetProperty("severity", out var severity) ? severity.GetString()! : "warning",
                a.GetProperty("annotations").TryGetProperty("summary", out var summary) ? summary.GetString()! : "Inspect Grafana")).ToArray();
        return new(DateTimeOffset.UtcNow, EnvironmentName, values, series, containers, alerts, "/observability/", configuration.GetValue<bool>("Observability:DiagnosticsEnabled"));
    }
    public async Task<IReadOnlyList<MonitoringLog>> LogsAsync(string level, string? traceId, CancellationToken ct)
    {
        var query = "{service_name=\"inventory-api\",deployment_environment_name=\"" + (EnvironmentName is "staging" or "production" ? EnvironmentName : "development") + "\"}";
        if (level == "error") query += " | severity_text =~ \"(?i)error|critical|fatal\"";
        else if (level == "warning") query += " | severity_text =~ \"(?i)warn.*\"";
        if (traceId is not null) query += " | trace_id=\"" + traceId + "\"";
        var end = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        using var json = await Read("Loki", $"/loki/api/v1/query_range?query={Uri.EscapeDataString(query)}&start={end - 3600}&end={end}&limit=100&direction=backward", ct);
        var entries = new List<MonitoringLog>();
        foreach (var stream in json.RootElement.GetProperty("data").GetProperty("result").EnumerateArray())
        foreach (var value in stream.GetProperty("values").EnumerateArray())
        {
            var metadata = value.GetArrayLength() > 2 ? value[2] : stream.GetProperty("stream");
            entries.Add(new(DateTimeOffset.FromUnixTimeMilliseconds(long.Parse(value[0].GetString()!, CultureInfo.InvariantCulture) / 1_000_000),
                metadata.TryGetProperty("severity_text", out var severity) ? severity.GetString()! : "INFO",
                value[1].GetString()!, metadata.TryGetProperty("trace_id", out var trace) ? trace.GetString() : null));
        }
        return entries.OrderByDescending(x => x.Timestamp).Take(100).ToArray();
    }
    public async Task<MonitoringTrace> TraceAsync(string traceId, CancellationToken ct)
    {
        using var json = await Read("Tempo", "/api/traces/" + traceId, ct);
        var spans = new List<TraceSpan>();
        var root = json.RootElement;
        var batches = root.TryGetProperty("batches", out var legacy) ? legacy : root.GetProperty("resourceSpans");
        foreach (var batch in batches.EnumerateArray())
        {
            var service = "inventory-api";
            if (batch.TryGetProperty("resource", out var resource) && resource.TryGetProperty("attributes", out var attributes))
                foreach (var attr in attributes.EnumerateArray()) if (attr.GetProperty("key").GetString() == "service.name") service = attr.GetProperty("value").GetProperty("stringValue").GetString()!;
            var scopes = batch.TryGetProperty("scopeSpans", out var modern) ? modern : batch.GetProperty("instrumentationLibrarySpans");
            foreach (var scope in scopes.EnumerateArray()) foreach (var span in scope.GetProperty("spans").EnumerateArray())
            {
                var start = ulong.Parse(span.GetProperty("startTimeUnixNano").GetString()!, CultureInfo.InvariantCulture);
                var end = ulong.Parse(span.GetProperty("endTimeUnixNano").GetString()!, CultureInfo.InvariantCulture);
                var error = span.TryGetProperty("status", out var status) && status.TryGetProperty("code", out var code)
                    && (code.ValueKind == JsonValueKind.Number ? code.GetInt32() == 2 : code.GetString() is "STATUS_CODE_ERROR" or "2");
                spans.Add(new(span.GetProperty("name").GetString()!, service, (end - start) / 1_000_000d, error));
            }
        }
        return new(traceId, spans.Take(200).ToArray());
    }
}
