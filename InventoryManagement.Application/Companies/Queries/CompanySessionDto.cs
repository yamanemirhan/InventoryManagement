namespace InventoryManagement.Application.Companies.Queries;

public sealed record CompanySessionDto(string SubjectId, bool PlatformAdmin, IReadOnlyList<CompanyWorkspaceDto> Companies);
