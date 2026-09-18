using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Api.Common.Operations;
// One API instance per environment; committed invitations are the durable delivery queue.
public sealed class InvitationEmailDispatcher(IServiceScopeFactory scopes, ILogger<InvitationEmailDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var store = scope.ServiceProvider.GetRequiredService<IInvitationDeliveryStore>();
                var sender = scope.ServiceProvider.GetRequiredService<IInvitationEmailSender>();
                foreach (var pending in await store.PendingAsync(stoppingToken))
                {
                    try { using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken); timeout.CancelAfter(TimeSpan.FromSeconds(20)); await sender.SendAsync(pending, timeout.Token); await store.CompleteAsync(pending.Id, stoppingToken); }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
                    catch (Exception ex) { await store.RetryAsync(pending.Id, pending.Attempts, stoppingToken); logger.LogWarning("Invitation delivery failed with {ExceptionType}; queued for retry.", ex.GetType().Name); }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogWarning("Invitation queue unavailable: {ExceptionType}", ex.GetType().Name); }
        }
    }
}
