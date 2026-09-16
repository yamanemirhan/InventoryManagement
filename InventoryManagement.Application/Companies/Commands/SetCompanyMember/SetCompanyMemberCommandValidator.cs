using FluentValidation;
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Application.Companies.Commands.SetCompanyMember;

public sealed class SetCompanyMemberCommandValidator : AbstractValidator<SetCompanyMemberCommand>
{
    public SetCompanyMemberCommandValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Role).NotEmpty().Must(x => CompanyRoles.All.Contains(x));
    }
}
