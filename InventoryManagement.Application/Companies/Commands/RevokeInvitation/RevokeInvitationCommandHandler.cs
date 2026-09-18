using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Companies.Common;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.Companies.Commands.RevokeInvitation;

public sealed class RevokeInvitationCommandHandler(ICompanyInvitationRepository invites, ICompanyRepository companies, IUnitOfWork unitOfWork, CompanyAccess access) : IRequestHandler<RevokeInvitationCommand>
{
    public async Task Handle(RevokeInvitationCommand request, CancellationToken ct)
    {
        var invitation = await invites.GetAsync(request.Id, ct) ?? throw new KeyNotFoundException("Invitation not found.");
        await using var transaction = await companies.LockMembershipAsync(invitation.CompanyId, ct);
        await access.RequireOwnerAsync(invitation.CompanyId, ct);
        if (invitation.AcceptedAtUtc is not null) throw new InvalidOperationException("Invitation has already been accepted.");
        invitation.RevokedAtUtc = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
    }
}
