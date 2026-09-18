using MediatR;
namespace InventoryManagement.Application.Companies.Commands.AcceptInvitation;

public sealed record AcceptInvitationCommand(Guid Id) : IRequest;
