using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;

namespace InventoryManagement.Application.Companies.Commands.CreateCompany;

public sealed class CreateCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICurrentUser user) : IRequestHandler<CreateCompanyCommand, Guid>
{
    public async Task<Guid> Handle(CreateCompanyCommand request, CancellationToken ct)
    {
        if (!await repository.UserExistsAsync(user.SubjectId, ct)) throw new InvalidOperationException("Load your session first.");
        var company = new Company { Name = request.Name.Trim() };
        await repository.AddAsync(company, ct);
        await repository.AddMemberAsync(new CompanyMember { CompanyId = company.Id, SubjectId = user.SubjectId, Role = "Owner" }, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return company.Id;
    }
}
