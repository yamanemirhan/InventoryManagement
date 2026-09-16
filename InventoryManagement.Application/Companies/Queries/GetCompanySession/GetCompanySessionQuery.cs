using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanySession;

public sealed record GetCompanySessionQuery() : IRequest<CompanySessionDto>;
