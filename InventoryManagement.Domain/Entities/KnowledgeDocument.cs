using InventoryManagement.Domain.Common;
using InventoryManagement.Domain.Exceptions;

namespace InventoryManagement.Domain.Entities;

public sealed class KnowledgeDocument : CompanyEntity
{
    private KnowledgeDocument() { }
    public KnowledgeDocument(string title, string content, string status) => Update(title, content, status);
    public string Title { get; private set; } = "";
    public string Content { get; private set; } = "";
    public string Status { get; private set; } = "Draft";
    public int Revision { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; }
    public void Update(string title, string content, string status)
    {
        if (status is not ("Draft" or "Published" or "Archived")) throw new DomainException("Invalid document status.");
        Title = title.Trim();
        Content = content.Trim();
        Status = status;
        Revision++;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
