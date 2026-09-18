using InventoryManagement.Domain.Entities;
using InventoryManagement.Application.Companies.Queries;
namespace InventoryManagement.Application.Common.Interfaces;

public interface ICompanyInvitationRepository
{
    Task<CompanyInvitation?> GetAsync(Guid id, CancellationToken ct);
    Task<CompanyInvitation?> GetPendingAsync(Guid companyId, string email, CancellationToken ct);
    Task AddAsync(CompanyInvitation invitation, CancellationToken ct);
    Task<IReadOnlyList<InvitationDto>> ListAsync(Guid? companyId, string email, CancellationToken ct);
}
