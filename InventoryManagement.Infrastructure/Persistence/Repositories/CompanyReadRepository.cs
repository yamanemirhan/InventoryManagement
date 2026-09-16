using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Queries;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class CompanyReadRepository(AppDbContext db) : ICompanyReadRepository
{
    public async Task<IReadOnlyList<CompanyWorkspaceDto>> GetWorkspacesAsync(string subjectId, bool platformAdmin, CancellationToken ct) =>
        await db.Companies.AsNoTracking()
            .Where(c => c.IsActive && (platformAdmin || db.CompanyMembers.Any(m => m.CompanyId == c.Id && m.SubjectId == subjectId)))
            .OrderBy(c => c.Name).ThenBy(c => c.Id)
            .Select(c => new CompanyWorkspaceDto(c.Id, c.Name, platformAdmin ? "Owner" : db.CompanyMembers.Where(m => m.CompanyId == c.Id && m.SubjectId == subjectId).Select(m => m.Role).First()))
            .ToListAsync(ct);

    public Task<CompanyAccessDto?> GetAccessAsync(Guid companyId, string subjectId, CancellationToken ct) =>
        db.Companies.AsNoTracking().Where(c => c.Id == companyId)
            .Select(c => new CompanyAccessDto(c.IsActive, db.CompanyMembers.Where(m => m.CompanyId == c.Id && m.SubjectId == subjectId).Select(m => m.Role).FirstOrDefault()))
            .SingleOrDefaultAsync(ct);

    public async Task<IReadOnlyList<CompanyMemberDto>> GetMembersAsync(Guid companyId, CancellationToken ct) =>
        await (from m in db.CompanyMembers.AsNoTracking()
            join u in db.ApplicationUsers.AsNoTracking() on m.SubjectId equals u.SubjectId
            where m.CompanyId == companyId orderby u.Name, m.Id
            select new CompanyMemberDto(m.Id, m.SubjectId, m.Role, u.Name, u.Email)).ToListAsync(ct);

    public async Task<CompanyAdminOverviewDto> GetAdminOverviewAsync(CancellationToken ct)
    {
        var companies = await db.Companies.AsNoTracking().OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Select(x => new CompanyAdminDto(x.Id, x.Name, x.IsActive, x.CreatedAtUtc, db.CompanyMembers.Count(m => m.CompanyId == x.Id))).ToListAsync(ct);
        var users = await db.ApplicationUsers.AsNoTracking().OrderBy(x => x.Name).ThenBy(x => x.SubjectId)
            .Select(x => new CompanyUserDto(x.SubjectId, x.Name, x.Email, db.CompanyMembers.Count(m => m.SubjectId == x.SubjectId))).ToListAsync(ct);
        return new(companies, users);
    }
}
