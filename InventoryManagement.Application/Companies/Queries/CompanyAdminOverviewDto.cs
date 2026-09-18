namespace InventoryManagement.Application.Companies.Queries;

public sealed record CompanyAdminOverviewDto(IReadOnlyList<CompanyAdminDto> Companies, IReadOnlyList<CompanyUserDto> Users);
