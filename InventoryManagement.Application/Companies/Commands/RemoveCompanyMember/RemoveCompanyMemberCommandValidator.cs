using FluentValidation;

namespace InventoryManagement.Application.Companies.Commands.RemoveCompanyMember;

public sealed class RemoveCompanyMemberCommandValidator : AbstractValidator<RemoveCompanyMemberCommand>
{
    public RemoveCompanyMemberCommandValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.MemberId).NotEmpty();
    }
}
