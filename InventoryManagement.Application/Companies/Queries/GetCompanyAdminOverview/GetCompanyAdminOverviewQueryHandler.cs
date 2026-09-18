using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanyAdminOverview;

public sealed class GetCompanyAdminOverviewQueryHandler(ICompanyReadRepository repository, CompanyAccess access) : IRequestHandler<GetCompanyAdminOverviewQuery, CompanyAdminOverviewDto>
{
    public async Task<CompanyAdminOverviewDto> Handle(GetCompanyAdminOverviewQuery request, CancellationToken ct)
    {
        access.RequirePlatformAdmin();
        return await repository.GetAdminOverviewAsync(ct);
    }
}
