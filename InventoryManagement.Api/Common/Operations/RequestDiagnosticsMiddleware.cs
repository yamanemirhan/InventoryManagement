using System.Diagnostics;
using Microsoft.AspNetCore.Routing;
using InventoryManagement.Application.Common.Telemetry;
using System.Diagnostics.Metrics;

namespace InventoryManagement.Api.Common.Operations;

public sealed class RequestDiagnosticsMiddleware(RequestDelegate next, ILogger<RequestDiagnosticsMiddleware> logger)
{
    private static readonly Counter<long> Requests = InventoryTelemetry.Meter.CreateCounter<long>("inventory.http.requests");
    private static readonly Histogram<double> Duration = InventoryTelemetry.Meter.CreateHistogram<double>("inventory.http.duration", "s");
    public async Task InvokeAsync(HttpContext http)
    {
        var trace = Activity.Current?.TraceId.ToString() ?? http.TraceIdentifier;
        http.TraceIdentifier = trace;
        http.Response.OnStarting(() => { http.Response.Headers["X-Request-Id"] = trace; return Task.CompletedTask; });
        var started = Stopwatch.GetTimestamp();
        try { await next(http); }
        finally
        {
            // Route templates avoid storing entity IDs, query tokens, bodies or authorization headers.
            var route = (http.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText ?? "unmatched";
            if (!http.Request.Path.StartsWithSegments("/health") && !http.Request.Path.StartsWithSegments("/api/health") && !http.Request.Path.StartsWithSegments("/api/realtime"))
            {
                var method = http.Request.Method is "GET" or "POST" or "PUT" or "DELETE" or "PATCH" or "HEAD" or "OPTIONS" ? http.Request.Method : "OTHER";
                var tags = new TagList { { "route", route }, { "method", method }, { "status", http.Response.StatusCode } };
                Requests.Add(1, tags);
                Duration.Record(Stopwatch.GetElapsedTime(started).TotalSeconds, tags);
            }
            if (http.Response.StatusCode >= 500)
                logger.LogError("Request {Method} {Route} returned {StatusCode} in {ElapsedMs} ms; TraceId {TraceId}",
                    http.Request.Method, route, http.Response.StatusCode, Stopwatch.GetElapsedTime(started).TotalMilliseconds, trace);
            else if (!http.Request.Path.StartsWithSegments("/health") && !http.Request.Path.StartsWithSegments("/api/health"))
                logger.LogInformation("Request {Method} {Route} returned {StatusCode} in {ElapsedMs} ms; TraceId {TraceId}",
                    http.Request.Method, route, http.Response.StatusCode, Stopwatch.GetElapsedTime(started).TotalMilliseconds, trace);
        }
    }
}
