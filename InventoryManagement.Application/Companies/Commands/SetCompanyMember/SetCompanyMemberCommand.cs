using MediatR;

namespace InventoryManagement.Application.Companies.Commands.SetCompanyMember;

public sealed record SetCompanyMemberCommand(Guid CompanyId, string SubjectId, string Role) : IRequest;
