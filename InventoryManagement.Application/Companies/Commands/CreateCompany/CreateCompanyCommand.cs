using MediatR;

namespace InventoryManagement.Application.Companies.Commands.CreateCompany;

public sealed record CreateCompanyCommand(string Name) : IRequest<Guid>;
