using FluentValidation;

namespace InventoryManagement.Application.Companies.Commands.CreateCompany;

public sealed class CreateCompanyCommandValidator : AbstractValidator<CreateCompanyCommand>
{
    public CreateCompanyCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200).Must(x => x is not null && x.Trim().Length >= 2);
    }
}
