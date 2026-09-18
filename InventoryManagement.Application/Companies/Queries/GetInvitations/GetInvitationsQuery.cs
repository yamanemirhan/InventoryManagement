using MediatR;
namespace InventoryManagement.Application.Companies.Queries.GetInvitations;

public sealed record GetInvitationsQuery(Guid? CompanyId) : IRequest<IReadOnlyList<InvitationDto>>;
