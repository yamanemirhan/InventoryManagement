using MediatR;

namespace InventoryManagement.Application.Companies.Commands.RemoveCompanyMember;

public sealed record RemoveCompanyMemberCommand(Guid CompanyId, Guid MemberId) : IRequest;
