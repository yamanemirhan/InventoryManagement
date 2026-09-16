using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;

namespace InventoryManagement.Application.Companies.Common;

public sealed class CompanyAccess(ICompanyReadRepository repository, ICurrentUser user)
{
    public async Task RequireOwnerAsync(Guid companyId, CancellationToken ct)
    {
        if (user.IsPlatformAdmin) return;
        var access = await repository.GetAccessAsync(companyId, user.SubjectId, ct);
        if (access?.Role != "Owner") throw new ForbiddenException();
    }

    public void RequirePlatformAdmin()
    {
        if (!user.IsPlatformAdmin) throw new ForbiddenException();
    }
}
