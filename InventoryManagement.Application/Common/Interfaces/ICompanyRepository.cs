using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Application.Common.Interfaces;

public interface ICompanyRepository
{
    Task SynchronizeUserAsync(string subjectId, string name, string email, CancellationToken ct);
    Task<bool> UserExistsAsync(string subjectId, CancellationToken ct);
    Task AddAsync(Company company, CancellationToken ct);
    Task<Company?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddMemberAsync(CompanyMember member, CancellationToken ct);
    Task<CompanyMember?> GetMemberAsync(Guid companyId, string subjectId, CancellationToken ct);
    Task<CompanyMember?> GetMemberByIdAsync(Guid companyId, Guid memberId, CancellationToken ct);
    Task<bool> HasOtherOwnerAsync(Guid companyId, Guid memberId, CancellationToken ct);
    void RemoveMember(CompanyMember member);
    Task<ICompanyTransaction> LockMembershipAsync(Guid companyId, CancellationToken ct);
}
