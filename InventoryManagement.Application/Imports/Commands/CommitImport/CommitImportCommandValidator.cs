using FluentValidation;
namespace InventoryManagement.Application.Imports.Commands.CommitImport;
public sealed class CommitImportCommandValidator : AbstractValidator<CommitImportCommand>
{
    public CommitImportCommandValidator()
    {
        RuleFor(x => x.Kind).Must(x => ImportRules.Kinds.Contains(x)).WithMessage("Select a supported import type.");
        RuleFor(x => x.Rows).NotNull().NotEmpty().Must(x => x is null || x.Count <= 1000).WithMessage("Maximum 1000 rows per import.");
        RuleForEach(x => x.Rows).NotNull();
    }
}
