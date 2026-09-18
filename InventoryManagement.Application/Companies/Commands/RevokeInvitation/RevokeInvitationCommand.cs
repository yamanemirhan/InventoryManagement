using MediatR;
namespace InventoryManagement.Application.Companies.Commands.RevokeInvitation;

public sealed record RevokeInvitationCommand(Guid Id) : IRequest;
