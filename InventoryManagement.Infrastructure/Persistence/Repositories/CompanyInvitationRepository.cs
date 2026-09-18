using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Queries;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class CompanyInvitationRepository(AppDbContext db) : ICompanyInvitationRepository
{
    public Task<CompanyInvitation?> GetAsync(Guid id, CancellationToken ct) => db.CompanyInvitations.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<CompanyInvitation?> GetPendingAsync(Guid companyId, string email, CancellationToken ct) => db.CompanyInvitations.SingleOrDefaultAsync(x => x.CompanyId == companyId && x.Email == email && x.AcceptedAtUtc == null && x.RevokedAtUtc == null, ct);
    public async Task AddAsync(CompanyInvitation invitation, CancellationToken ct) => await db.CompanyInvitations.AddAsync(invitation, ct);
    public async Task<IReadOnlyList<InvitationDto>> ListAsync(Guid? companyId, string email, CancellationToken ct) =>
     await (from i in db.CompanyInvitations.AsNoTracking()
            join c in db.Companies on i.CompanyId equals c.Id
            where companyId != null ? i.CompanyId == companyId : i.Email == email && i.AcceptedAtUtc == null && i.RevokedAtUtc == null && i.ExpiresAtUtc > DateTime.UtcNow && c.IsActive
            orderby i.CreatedAtUtc descending, i.Id
            select new InvitationDto(i.Id, c.Id, c.Name, i.Email, i.Role, i.ExpiresAtUtc, i.AcceptedAtUtc, i.RevokedAtUtc, i.EmailSentAtUtc, i.EmailAttempts)).Take(200).ToListAsync(ct);
}
