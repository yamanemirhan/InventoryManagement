namespace InventoryManagement.Application.Workspace.Queries;

public sealed record KnowledgeListItemDto(Guid Id, string Title, string Status, int Revision, DateTime UpdatedAtUtc);
