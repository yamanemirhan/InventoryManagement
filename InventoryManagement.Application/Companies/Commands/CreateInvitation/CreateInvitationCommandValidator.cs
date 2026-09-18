using FluentValidation;
namespace InventoryManagement.Application.Companies.Commands.CreateInvitation;

public sealed class CreateInvitationCommandValidator : AbstractValidator<CreateInvitationCommand>
{
    public CreateInvitationCommandValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty(); RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Role).Must(x => x is "Manager" or "Operator" or "Viewer");
    }
}
