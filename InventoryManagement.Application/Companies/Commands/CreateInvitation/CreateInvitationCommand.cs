using MediatR;
namespace InventoryManagement.Application.Companies.Commands.CreateInvitation;

public sealed record CreateInvitationCommand(Guid CompanyId, string Email, string Role) : IRequest<Guid>;
