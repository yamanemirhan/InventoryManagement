using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanyMembers;

public sealed record GetCompanyMembersQuery(Guid CompanyId) : IRequest<IReadOnlyList<CompanyMemberDto>>;
