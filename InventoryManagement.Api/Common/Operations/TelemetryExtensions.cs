using System.Diagnostics;
using InventoryManagement.Application.Common.Telemetry;
using InventoryManagement.Application.Monitoring;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace InventoryManagement.Api.Common.Operations;

public static class TelemetryExtensions
{
    public static void AddInventoryTelemetry(this WebApplicationBuilder builder)
    {
        var endpoint = builder.Configuration["Observability:OtlpEndpoint"];
        if (string.IsNullOrWhiteSpace(endpoint)) return;
        var resource = ResourceBuilder.CreateDefault().AddService("inventory-api")
            .AddAttributes([new("deployment.environment.name", builder.Environment.EnvironmentName.ToLowerInvariant())]);
        builder.Services.AddOpenTelemetry().ConfigureResource(r => r.AddService("inventory-api")
                .AddAttributes([new("deployment.environment.name", builder.Environment.EnvironmentName.ToLowerInvariant())]))
            .WithTracing(t => t.SetSampler(new AlwaysOnSampler()).AddSource(InventoryTelemetry.Name)
                .AddAspNetCoreInstrumentation(o => o.Filter = context => !context.Request.Path.StartsWithSegments("/health")
                    && !context.Request.Path.StartsWithSegments("/api/health") && !context.Request.Path.StartsWithSegments("/api/realtime"))
                .AddHttpClientInstrumentation(o => o.FilterHttpRequestMessage = request => request.RequestUri?.Host is not ("prometheus" or "loki" or "tempo"))
                .AddProcessor(new PrivateTraceProcessor())
                .AddOtlpExporter(o => { o.Endpoint = new Uri(endpoint); o.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; o.TimeoutMilliseconds = 3000; }))
            .WithMetrics(m => m.AddMeter(InventoryTelemetry.Name).AddRuntimeInstrumentation()
                .AddOtlpExporter((o, reader) => { o.Endpoint = new Uri(endpoint); o.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; o.TimeoutMilliseconds = 3000;
                    reader.PeriodicExportingMetricReaderOptions.ExportIntervalMilliseconds = 15000; }));
        builder.Logging.AddFilter<OpenTelemetryLoggerProvider>("", LogLevel.None);
        builder.Logging.AddFilter<OpenTelemetryLoggerProvider>("InventoryManagement", LogLevel.Information);
        builder.Logging.AddOpenTelemetry(o =>
        {
            o.SetResourceBuilder(resource); o.IncludeFormattedMessage = true; o.IncludeScopes = false;
            o.AddOtlpExporter(e => { e.Endpoint = new Uri(endpoint); e.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc; e.TimeoutMilliseconds = 3000; });
        });
    }
}

// Remove URLs/queries and anything that could identify a customer. No SQL or request payload capture.
internal sealed class PrivateTraceProcessor : BaseProcessor<Activity>
{
    public override void OnEnd(Activity activity)
    {
        foreach (var key in activity.TagObjects.Select(x => x.Key).Where(key => key.StartsWith("url.") || key.StartsWith("http.url")
            || key is "http.target" or "user_agent.original" or "client.address" or "network.peer.address"
            || key.StartsWith("exception.") || key.StartsWith("db.statement") || key.StartsWith("db.query")
            || key.StartsWith("http.request.header.") || key.StartsWith("http.response.header.") || key.StartsWith("enduser.")
            || key.StartsWith("user.") || key == "db.connection_string").ToArray())
            activity.SetTag(key, null);
        base.OnEnd(activity);
    }
}
