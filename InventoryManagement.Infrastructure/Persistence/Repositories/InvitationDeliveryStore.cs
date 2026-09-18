using InventoryManagement.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class InvitationDeliveryStore(AppDbContext db) : IInvitationDeliveryStore
{
    public async Task<IReadOnlyList<InvitationDelivery>> PendingAsync(CancellationToken ct) => await (
     from i in db.CompanyInvitations.AsNoTracking()
     join c in db.Companies on i.CompanyId equals c.Id
     where c.IsActive && i.EmailSentAtUtc == null && i.AcceptedAtUtc == null && i.RevokedAtUtc == null && i.ExpiresAtUtc > DateTime.UtcNow && i.NextEmailAttemptAtUtc <= DateTime.UtcNow && i.EmailAttempts < 8
     orderby i.CreatedAtUtc
     select new InvitationDelivery(i.Id, i.Email, c.Name, i.EmailAttempts)).Take(5).ToListAsync(ct);
    public Task CompleteAsync(Guid id, CancellationToken ct) => db.CompanyInvitations.Where(x => x.Id == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.EmailSentAtUtc, DateTime.UtcNow), ct);
    public Task RetryAsync(Guid id, int attempts, CancellationToken ct) { var next = DateTime.UtcNow.AddMinutes(Math.Min(360, Math.Pow(2, attempts + 1))); return db.CompanyInvitations.Where(x => x.Id == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.EmailAttempts, attempts + 1).SetProperty(x => x.NextEmailAttemptAtUtc, next), ct); }
}
