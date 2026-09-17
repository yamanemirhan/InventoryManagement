using System.Diagnostics;
using Microsoft.AspNetCore.Routing;

namespace InventoryManagement.Api.Common.Operations;

public sealed class RequestDiagnosticsMiddleware(RequestDelegate next, ILogger<RequestDiagnosticsMiddleware> logger)
{
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
            if (http.Response.StatusCode >= 500)
                logger.LogError("Request {Method} {Route} returned {StatusCode} in {ElapsedMs} ms; TraceId {TraceId}",
                    http.Request.Method, route, http.Response.StatusCode, Stopwatch.GetElapsedTime(started).TotalMilliseconds, trace);
            else if (!http.Request.Path.StartsWithSegments("/health") && !http.Request.Path.StartsWithSegments("/api/health"))
                logger.LogInformation("Request {Method} {Route} returned {StatusCode} in {ElapsedMs} ms; TraceId {TraceId}",
                    http.Request.Method, route, http.Response.StatusCode, Stopwatch.GetElapsedTime(started).TotalMilliseconds, trace);
        }
    }
}
