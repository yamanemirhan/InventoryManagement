using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Companies.Common;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.Companies.Commands.AcceptInvitation;

public sealed class AcceptInvitationCommandHandler(ICompanyInvitationRepository invites, ICompanyRepository companies, IUnitOfWork unitOfWork, ICurrentUser user) : IRequestHandler<AcceptInvitationCommand>
{
    public async Task Handle(AcceptInvitationCommand request, CancellationToken ct)
    {
        if (!user.EmailVerified || string.IsNullOrWhiteSpace(user.Email)) throw new ForbiddenException();
        var invitation = await invites.GetAsync(request.Id, ct) ?? throw new KeyNotFoundException("Invitation not found.");
        if (invitation.Email != user.Email.Trim().ToLowerInvariant()) throw new ForbiddenException();
        await using var transaction = await companies.LockMembershipAsync(invitation.CompanyId, ct);
        if (invitation.RevokedAtUtc is not null || invitation.AcceptedAtUtc is not null || invitation.ExpiresAtUtc <= DateTime.UtcNow) throw new InvalidOperationException("Invitation is no longer valid.");
        if ((await companies.GetByIdAsync(invitation.CompanyId, ct))?.IsActive != true) throw new InvalidOperationException("Company is inactive.");
        await companies.SynchronizeUserAsync(user.SubjectId, user.Name, user.Email, ct);
        if (await companies.GetMemberAsync(invitation.CompanyId, user.SubjectId, ct) is null)
            await companies.AddMemberAsync(new CompanyMember { CompanyId = invitation.CompanyId, SubjectId = user.SubjectId, Role = invitation.Role }, ct);
        invitation.AcceptedAtUtc = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
    }
}
