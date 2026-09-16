using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Companies.Commands.RemoveCompanyMember;

public sealed class RemoveCompanyMemberCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, CompanyAccess access) : IRequestHandler<RemoveCompanyMemberCommand>
{
    public async Task Handle(RemoveCompanyMemberCommand request, CancellationToken ct)
    {
        await using var transaction = await repository.LockMembershipAsync(request.CompanyId, ct);
        await access.RequireOwnerAsync(request.CompanyId, ct);
        var member = await repository.GetMemberByIdAsync(request.CompanyId, request.MemberId, ct) ?? throw new KeyNotFoundException("Company member not found.");
        if (member.Role == "Owner" && !await repository.HasOtherOwnerAsync(request.CompanyId, member.Id, ct))
            throw new InvalidOperationException("A company must retain at least one owner.");
        repository.RemoveMember(member);
        await unitOfWork.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
