namespace InventoryManagement.Application.Companies.Queries;

public sealed record CompanyMemberDto(Guid Id, string SubjectId, string Role, string Name, string Email);
