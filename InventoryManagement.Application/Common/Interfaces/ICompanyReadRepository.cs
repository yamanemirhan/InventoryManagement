using InventoryManagement.Application.Companies.Queries;

namespace InventoryManagement.Application.Common.Interfaces;

public interface ICompanyReadRepository
{
    Task<IReadOnlyList<CompanyWorkspaceDto>> GetWorkspacesAsync(string subjectId, bool platformAdmin, CancellationToken ct);
    Task<CompanyAccessDto?> GetAccessAsync(Guid companyId, string subjectId, CancellationToken ct);
    Task<IReadOnlyList<CompanyMemberDto>> GetMembersAsync(Guid companyId, CancellationToken ct);
    Task<CompanyAdminOverviewDto> GetAdminOverviewAsync(CancellationToken ct);
}
