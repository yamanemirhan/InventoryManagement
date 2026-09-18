using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using MediatR;
namespace InventoryManagement.Application.Companies.Queries.GetInvitations;

public sealed class GetInvitationsQueryHandler(ICompanyInvitationRepository invites, CompanyAccess access, ICurrentUser user) : IRequestHandler<GetInvitationsQuery, IReadOnlyList<InvitationDto>>
{
    public async Task<IReadOnlyList<InvitationDto>> Handle(GetInvitationsQuery query, CancellationToken ct)
    {
        if (query.CompanyId is Guid id) await access.RequireOwnerAsync(id, ct);
        else if (!user.EmailVerified) return [];
        return await invites.ListAsync(query.CompanyId, user.Email.Trim().ToLowerInvariant(), ct);
    }
}
