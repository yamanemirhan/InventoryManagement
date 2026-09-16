using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class CompanyRepository(AppDbContext db) : ICompanyRepository
{
    public async Task SynchronizeUserAsync(string subjectId, string name, string email, CancellationToken ct) =>
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO \"ApplicationUsers\" (\"SubjectId\", \"Name\", \"Email\") VALUES ({subjectId}, {name}, {email}) ON CONFLICT (\"SubjectId\") DO UPDATE SET \"Name\" = EXCLUDED.\"Name\", \"Email\" = EXCLUDED.\"Email\"", ct);

    public Task<bool> UserExistsAsync(string subjectId, CancellationToken ct) =>
        db.ApplicationUsers.AnyAsync(x => x.SubjectId == subjectId, ct);
    public async Task AddAsync(Company company, CancellationToken ct) => await db.Companies.AddAsync(company, ct);
    public Task<Company?> GetByIdAsync(Guid id, CancellationToken ct) => db.Companies.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task AddMemberAsync(CompanyMember member, CancellationToken ct) => await db.CompanyMembers.AddAsync(member, ct);
    public Task<CompanyMember?> GetMemberAsync(Guid companyId, string subjectId, CancellationToken ct) =>
        db.CompanyMembers.SingleOrDefaultAsync(x => x.CompanyId == companyId && x.SubjectId == subjectId, ct);
    public Task<CompanyMember?> GetMemberByIdAsync(Guid companyId, Guid memberId, CancellationToken ct) =>
        db.CompanyMembers.SingleOrDefaultAsync(x => x.CompanyId == companyId && x.Id == memberId, ct);
    public Task<bool> HasOtherOwnerAsync(Guid companyId, Guid memberId, CancellationToken ct) =>
        db.CompanyMembers.AnyAsync(x => x.CompanyId == companyId && x.Role == "Owner" && x.Id != memberId, ct);
    public void RemoveMember(CompanyMember member) => db.CompanyMembers.Remove(member);

    public async Task<ICompanyTransaction> LockMembershipAsync(Guid companyId, CancellationToken ct)
    {
        var transaction = await db.Database.BeginTransactionAsync(ct);
        try
        {
            // Lock before authorization and owner checks to serialize membership changes.
            var company = await db.Companies.FromSqlInterpolated($"SELECT * FROM \"Companies\" WHERE \"Id\" = {companyId} FOR UPDATE").SingleOrDefaultAsync(ct);
            if (company is null) throw new KeyNotFoundException("Company not found.");
            return new CompanyTransaction(transaction);
        }
        catch
        {
            await transaction.DisposeAsync();
            throw;
        }
    }

    private sealed class CompanyTransaction(IDbContextTransaction transaction) : ICompanyTransaction
    {
        public Task CommitAsync(CancellationToken ct) => transaction.CommitAsync(ct);
        public ValueTask DisposeAsync() => transaction.DisposeAsync();
    }
}
