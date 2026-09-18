using InventoryManagement.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace InventoryManagement.Api.Common.Operations;

public sealed class DependencyHealthCheck(AppDbContext db, IHttpClientFactory clients, IConfiguration config) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            if (!await db.Database.CanConnectAsync(timeout.Token)) return HealthCheckResult.Unhealthy("Database unavailable");
            var authority = config["Authentication:Authority"]!.TrimEnd('/');
            using var response = await clients.CreateClient("readiness").GetAsync(authority + "/.well-known/openid-configuration", timeout.Token);
            return response.IsSuccessStatusCode ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy("Identity unavailable");
        }
        catch (Exception) when (!ct.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Dependency unavailable");
        }
    }
}
