using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanyMembers;

public sealed class GetCompanyMembersQueryHandler(ICompanyReadRepository repository, CompanyAccess access) : IRequestHandler<GetCompanyMembersQuery, IReadOnlyList<CompanyMemberDto>>
{
    public async Task<IReadOnlyList<CompanyMemberDto>> Handle(GetCompanyMembersQuery request, CancellationToken ct)
    {
        await access.RequireOwnerAsync(request.CompanyId, ct);
        return await repository.GetMembersAsync(request.CompanyId, ct);
    }
}
