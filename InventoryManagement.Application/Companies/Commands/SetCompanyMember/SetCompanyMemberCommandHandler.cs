using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Exceptions;
using MediatR;

namespace InventoryManagement.Application.Companies.Commands.SetCompanyMember;

public sealed class SetCompanyMemberCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, CompanyAccess access) : IRequestHandler<SetCompanyMemberCommand>
{
    public async Task Handle(SetCompanyMemberCommand request, CancellationToken ct)
    {
        await using var transaction = await repository.LockMembershipAsync(request.CompanyId, ct);
        await access.RequireOwnerAsync(request.CompanyId, ct);
        if (!await repository.UserExistsAsync(request.SubjectId, ct)) throw new DomainException("The user must sign in to the application first. Use their account ID.");
        var member = await repository.GetMemberAsync(request.CompanyId, request.SubjectId, ct);
        if (member?.Role == "Owner" && request.Role != "Owner" && !await repository.HasOtherOwnerAsync(request.CompanyId, member.Id, ct))
            throw new InvalidOperationException("A company must retain at least one owner.");
        if (member is null) await repository.AddMemberAsync(new CompanyMember { CompanyId = request.CompanyId, SubjectId = request.SubjectId, Role = request.Role }, ct);
        else member.Role = request.Role;
        await unitOfWork.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
