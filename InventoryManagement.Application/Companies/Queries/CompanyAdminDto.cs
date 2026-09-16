namespace InventoryManagement.Application.Companies.Queries;

public sealed record CompanyAdminDto(Guid Id, string Name, bool IsActive, DateTime CreatedAtUtc, int MemberCount);
