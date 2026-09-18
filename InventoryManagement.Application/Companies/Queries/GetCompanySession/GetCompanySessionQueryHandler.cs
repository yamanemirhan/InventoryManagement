using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanySession;

public sealed class GetCompanySessionQueryHandler(ICompanyReadRepository repository, ICurrentUser user) : IRequestHandler<GetCompanySessionQuery, CompanySessionDto>
{
    public async Task<CompanySessionDto> Handle(GetCompanySessionQuery request, CancellationToken ct)
    {
        var companies = await repository.GetWorkspacesAsync(user.SubjectId, user.IsPlatformAdmin, ct);
        return new(user.SubjectId, user.IsPlatformAdmin, companies);
    }
}
