using System.Diagnostics.Metrics;
using InventoryManagement.Application.Common.Telemetry;
using InventoryManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Api.Common.Operations;

public sealed class BusinessMetricsWorker(IServiceScopeFactory scopes, ILogger<BusinessMetricsWorker> logger) : BackgroundService
{
    private Snapshot snapshot = new(0, 0, 0, 0, 0, 0, 0);
    private sealed record Snapshot(long RealtimePending, double OldestSeconds, long EmailPending, long EmailRetried, long LowStocks, int Success, double UpdatedAt);
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var meter = InventoryTelemetry.Meter;
        meter.CreateObservableGauge("inventory.outbox.pending", () => Volatile.Read(ref snapshot).RealtimePending);
        meter.CreateObservableGauge("inventory.outbox.oldest", () => Volatile.Read(ref snapshot).OldestSeconds, "s");
        meter.CreateObservableGauge("inventory.email.pending", () => Volatile.Read(ref snapshot).EmailPending);
        meter.CreateObservableGauge("inventory.email.retried", () => Volatile.Read(ref snapshot).EmailRetried);
        meter.CreateObservableGauge("inventory.stock.low", () => Volatile.Read(ref snapshot).LowStocks);
        meter.CreateObservableGauge("inventory.business.collector.healthy", () => Volatile.Read(ref snapshot).Success);
        meter.CreateObservableGauge("inventory.business.collector.updated", () => Volatile.Read(ref snapshot).UpdatedAt, "s");
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(10));
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var ct = timeout.Token; var now = DateTime.UtcNow;
                // Deliberate system-wide aggregates; no IDs, names or individual company series are exported.
                var events = db.ActivityEntries.IgnoreQueryFilters().Where(x => x.PublishedAtUtc == null);
                var pending = await events.LongCountAsync(ct);
                var oldest = await events.Select(x => (DateTime?)x.CreatedAtUtc).MinAsync(ct);
                var emails = db.CompanyInvitations.Where(x => x.EmailSentAtUtc == null && x.RevokedAtUtc == null && x.AcceptedAtUtc == null && x.ExpiresAtUtc > now);
                var emailPending = await emails.LongCountAsync(ct);
                var retries = await emails.LongCountAsync(x => x.EmailAttempts > 0, ct);
                var low = await db.Stocks.IgnoreQueryFilters().LongCountAsync(x => x.MinimumQuantity > 0 && x.Quantity < x.MinimumQuantity, ct);
                Volatile.Write(ref snapshot, new(pending, oldest.HasValue ? (now - oldest.Value).TotalSeconds : 0, emailPending, retries, low, 1, DateTimeOffset.UtcNow.ToUnixTimeSeconds()));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                Volatile.Write(ref snapshot, Volatile.Read(ref snapshot) with { Success = 0 });
                logger.LogWarning("Business metrics unavailable: {ExceptionType}", ex.GetType().Name);
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
