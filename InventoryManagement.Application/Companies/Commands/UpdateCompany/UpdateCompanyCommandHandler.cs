using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Companies.Common;
using MediatR;

namespace InventoryManagement.Application.Companies.Commands.UpdateCompany;

public sealed class UpdateCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, CompanyAccess access) : IRequestHandler<UpdateCompanyCommand>
{
    public async Task Handle(UpdateCompanyCommand request, CancellationToken ct)
    {
        access.RequirePlatformAdmin();
        var company = await repository.GetByIdAsync(request.CompanyId, ct) ?? throw new KeyNotFoundException("Company not found.");
        company.Name = request.Name.Trim();
        company.IsActive = request.IsActive;
        await unitOfWork.SaveChangesAsync(ct);
    }
}
