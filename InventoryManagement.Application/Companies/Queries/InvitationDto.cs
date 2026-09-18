namespace InventoryManagement.Application.Companies.Queries;

public sealed record InvitationDto(Guid Id, Guid CompanyId, string CompanyName, string Email, string Role,
 DateTime ExpiresAtUtc, DateTime? AcceptedAtUtc, DateTime? RevokedAtUtc, DateTime? EmailSentAtUtc, int EmailAttempts);
