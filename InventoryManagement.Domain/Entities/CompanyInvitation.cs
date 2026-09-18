using InventoryManagement.Domain.Common;
namespace InventoryManagement.Domain.Entities;

public sealed class CompanyInvitation : Entity
{
    public Guid CompanyId { get; set; }
    public string Email { get; set; } = "";
    public string Role { get; set; } = "Viewer";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; } = DateTime.UtcNow.AddDays(7);
    public DateTime? AcceptedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public DateTime? EmailSentAtUtc { get; set; }
    public DateTime NextEmailAttemptAtUtc { get; set; } = DateTime.UtcNow;
    public int EmailAttempts { get; set; }
    public uint Version { get; private set; }
}
