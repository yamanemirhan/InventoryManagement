using MediatR;

namespace InventoryManagement.Application.Companies.Commands.UpdateCompany;

public sealed record UpdateCompanyCommand(Guid CompanyId, string Name, bool IsActive) : IRequest;
