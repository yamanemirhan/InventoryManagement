using InventoryManagement.Domain.Common;

namespace InventoryManagement.Domain.Entities;

public sealed class ImportBatch : CompanyEntity
{
    private ImportBatch() { }
    public ImportBatch(string kind, string fingerprint, int records, string actorSubjectId)
    { Kind = kind; Fingerprint = fingerprint; Records = records; ActorSubjectId = actorSubjectId; }
    public string Kind { get; private set; } = "";
    public string Fingerprint { get; private set; } = "";
    public int Records { get; private set; }
    public string ActorSubjectId { get; private set; } = "";
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
}
