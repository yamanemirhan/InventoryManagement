namespace InventoryManagement.Application.Common.Interfaces;

public sealed record RealtimeEvent(Guid Id, Guid CompanyId, string EntityType, DateTime CreatedAtUtc);
public interface IRealtimeEventStore
{
    Task<IReadOnlyList<RealtimeEvent>> GetPendingAsync(CancellationToken ct);
    Task MarkPublishedAsync(Guid[] ids, CancellationToken ct);
}
