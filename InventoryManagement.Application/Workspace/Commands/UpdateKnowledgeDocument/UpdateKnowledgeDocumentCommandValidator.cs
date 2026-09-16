using FluentValidation;
namespace InventoryManagement.Application.Workspace.Commands.UpdateKnowledgeDocument;

public sealed class UpdateKnowledgeDocumentCommandValidator : AbstractValidator<UpdateKnowledgeDocumentCommand>
{
    public UpdateKnowledgeDocumentCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty(); RuleFor(x => x.Revision).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(30000);
        RuleFor(x => x.Status).Must(x => x is "Draft" or "Published" or "Archived");
    }
}
