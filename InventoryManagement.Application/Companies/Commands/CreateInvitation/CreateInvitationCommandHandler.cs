using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Companies.Common;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.Companies.Commands.CreateInvitation;

public sealed class CreateInvitationCommandHandler(ICompanyInvitationRepository invites, ICompanyRepository companies, IUnitOfWork unitOfWork, CompanyAccess access) : IRequestHandler<CreateInvitationCommand, Guid>
{
    public async Task<Guid> Handle(CreateInvitationCommand request, CancellationToken ct)
    {
        await using var transaction = await companies.LockMembershipAsync(request.CompanyId, ct);
        await access.RequireOwnerAsync(request.CompanyId, ct);
        var company = await companies.GetByIdAsync(request.CompanyId, ct);
        if (company?.IsActive != true) throw new InvalidOperationException("Company is inactive.");
        var email = request.Email.Trim().ToLowerInvariant();
        var previous = await invites.GetPendingAsync(request.CompanyId, email, ct);
        if (previous is not null) { previous.RevokedAtUtc = DateTime.UtcNow; await unitOfWork.SaveChangesAsync(ct); }
        var invitation = new CompanyInvitation { CompanyId = request.CompanyId, Email = email, Role = request.Role };
        await invites.AddAsync(invitation, ct);
        // Flush revocation before inserting its replacement under the unique pending-email constraint.
        await unitOfWork.SaveChangesAsync(ct); await transaction.CommitAsync(ct);
        return invitation.Id;
    }
}
