using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public sealed class ActivityEntry : Entity
{
    public Guid CompanyId { get; set; }
    public string EntityType { get; set; } = "";
    public Guid EntityId { get; set; }
    public string Action { get; set; } = "";
    public string? ActorSubjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAtUtc { get; set; }
}
