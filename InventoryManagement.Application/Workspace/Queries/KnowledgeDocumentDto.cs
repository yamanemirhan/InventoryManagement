namespace InventoryManagement.Application.Workspace.Queries;

public sealed record KnowledgeDocumentDto(Guid Id, string Title, string Content, string Status, int Revision, DateTime CreatedAtUtc, DateTime UpdatedAtUtc);
