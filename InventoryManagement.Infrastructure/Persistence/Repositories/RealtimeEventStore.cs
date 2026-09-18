using InventoryManagement.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

// Only the internal dispatcher reads across tenants; no event data is exposed over HTTP.
public sealed class RealtimeEventStore(AppDbContext db) : IRealtimeEventStore
{
    public async Task<IReadOnlyList<RealtimeEvent>> GetPendingAsync(CancellationToken ct) =>
        await db.ActivityEntries.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.PublishedAtUtc == null).OrderBy(x => x.CreatedAtUtc).ThenBy(x => x.Id)
            .Take(200).Select(x => new RealtimeEvent(x.Id, x.CompanyId, x.EntityType, x.CreatedAtUtc)).ToListAsync(ct);

    public async Task MarkPublishedAsync(Guid[] ids, CancellationToken ct) =>
        await db.ActivityEntries.IgnoreQueryFilters().Where(x => ids.Contains(x.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.PublishedAtUtc, DateTime.UtcNow), ct);
}
