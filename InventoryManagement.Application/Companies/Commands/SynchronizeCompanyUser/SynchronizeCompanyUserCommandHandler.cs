using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Companies.Commands.SynchronizeCompanyUser;

public sealed class SynchronizeCompanyUserCommandHandler(ICompanyRepository repository, ICurrentUser user) : IRequestHandler<SynchronizeCompanyUserCommand>
{
    public async Task Handle(SynchronizeCompanyUserCommand request, CancellationToken ct)
    {
        await repository.SynchronizeUserAsync(user.SubjectId, user.Name, user.Email, ct);
    }
}
