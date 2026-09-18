namespace InventoryManagement.Application.Common.Interfaces;

public sealed record InvitationDelivery(Guid Id, string Email, string CompanyName, int Attempts);
public interface IInvitationDeliveryStore
{
    Task<IReadOnlyList<InvitationDelivery>> PendingAsync(CancellationToken ct);
    Task CompleteAsync(Guid id, CancellationToken ct);
    Task RetryAsync(Guid id, int attempts, CancellationToken ct);
}
public interface IInvitationEmailSender { Task SendAsync(InvitationDelivery delivery, CancellationToken ct); }
