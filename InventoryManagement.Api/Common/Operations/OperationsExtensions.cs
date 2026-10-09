using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace InventoryManagement.Api.Common.Operations;

public static class OperationsExtensions
{
    public static IServiceCollection AddOperations(this IServiceCollection services)
    {
        services.AddHttpClient("readiness", client => client.Timeout = TimeSpan.FromSeconds(5));
        services.AddHealthChecks().AddCheck<DependencyHealthCheck>("dependencies", tags: ["ready"]);
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("assistant", http => RateLimitPartition.GetFixedWindowLimiter(
                http.User.FindFirstValue("sub") ?? "anonymous-assistant", _ => new()
                { PermitLimit = 4, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(http =>
            {
                if (http.Request.Path == "/health" || http.Request.Path == "/api/health")
                    return RateLimitPartition.GetNoLimiter("health");
                if (http.Request.Path == "/api/health/ready")
                    return RateLimitPartition.GetFixedWindowLimiter("readiness", _ => new()
                    {
                        PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
                    });
                var subject = http.User.FindFirstValue("sub");
                var write = !HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method);
                var key = subject is null ? "anonymous" : subject;
                return RateLimitPartition.GetFixedWindowLimiter(key + (write ? ":write" : ":read"), _ => new()
                {
                    PermitLimit = subject is null ? 300 : write ? 60 : 300,
                    Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true
                });
            });
            options.OnRejected = async (context, ct) =>
            {
                var retry = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var value)
                    ? Math.Max(1, (int)Math.Ceiling(value.TotalSeconds)) : 60;
                context.HttpContext.Response.Headers.RetryAfter = retry.ToString(System.Globalization.CultureInfo.InvariantCulture);
                await Results.Problem(statusCode: 429, title: "Too many requests",
                    detail: "Wait before retrying.", extensions: new Dictionary<string, object?>
                    { ["traceId"] = context.HttpContext.TraceIdentifier }).ExecuteAsync(context.HttpContext);
            };
        });
        return services;
    }
}
