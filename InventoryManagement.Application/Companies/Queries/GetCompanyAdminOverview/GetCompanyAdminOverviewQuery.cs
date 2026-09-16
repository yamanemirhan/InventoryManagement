using MediatR;

namespace InventoryManagement.Application.Companies.Queries.GetCompanyAdminOverview;

public sealed record GetCompanyAdminOverviewQuery() : IRequest<CompanyAdminOverviewDto>;
