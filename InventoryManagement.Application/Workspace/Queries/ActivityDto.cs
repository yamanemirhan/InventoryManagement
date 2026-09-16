namespace InventoryManagement.Application.Workspace.Queries;

public sealed record ActivityDto(Guid Id, string EntityType, Guid EntityId, string Action, string? ActorSubjectId, DateTime CreatedAtUtc);
