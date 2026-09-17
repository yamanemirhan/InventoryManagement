using InventoryManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace InventoryManagement.Api.Realtime;

// One API instance per environment. The committed audit rows are the durable outbox.
public sealed class WorkspaceEventDispatcher(
    IServiceScopeFactory scopes, IHubContext<WorkspaceHub> hub,
    WorkspaceConnections connections, ILogger<WorkspaceEventDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(2));
        var failures = 0;
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var store = scope.ServiceProvider.GetRequiredService<IRealtimeEventStore>();
                var companies = scope.ServiceProvider.GetRequiredService<ICompanyReadRepository>();
                var pending = await store.GetPendingAsync(stoppingToken);
                foreach (var subscribers in connections.Snapshot().GroupBy(x => new { x.CompanyId, x.SubjectId, x.Admin }))
                {
                    var access = await companies.GetAccessAsync(subscribers.Key.CompanyId, subscribers.Key.SubjectId, stoppingToken);
                    var allowed = access?.IsActive == true && (access.Role is not null || subscribers.Key.Admin);
                    foreach (var connection in subscribers)
                    {
                        if (connection.ExpiresAt <= DateTimeOffset.UtcNow)
                        {
                            connections.Remove(connection.Id);
                            continue;
                        }
                        if (!allowed)
                        {
                            connections.Remove(connection.Id);
                            await hub.Clients.Client(connection.Id).SendAsync("AccessChanged", cancellationToken: stoppingToken);
                            continue;
                        }
                        var events = pending.Where(x => x.CompanyId == connection.CompanyId).ToArray();
                        if (events.Length == 0) continue;
                        // No document bodies, record IDs, actor identities or draft metadata leave the server.
                        await hub.Clients.Client(connection.Id).SendAsync("WorkspaceChanged", new
                        {
                            id = events[^1].Id,
                            companyId = connection.CompanyId,
                            createdAtUtc = events.Max(x => x.CreatedAtUtc)
                        }, stoppingToken);
                    }
                }
                if (pending.Count > 0) await store.MarkPublishedAsync(pending.Select(x => x.Id).ToArray(), stoppingToken);
                failures = 0;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                failures++;
                logger.LogError("Workspace dispatch failed with {ExceptionType}; attempt {Attempt}. Pending events will be retried.",
                    ex.GetType().Name, failures);
                await Task.Delay(TimeSpan.FromSeconds(Math.Min(60, Math.Pow(2, Math.Min(failures, 6)))), stoppingToken);
            }
        }
    }
}
