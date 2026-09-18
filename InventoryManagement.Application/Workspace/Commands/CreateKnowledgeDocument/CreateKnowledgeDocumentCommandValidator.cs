using FluentValidation;
namespace InventoryManagement.Application.Workspace.Commands.CreateKnowledgeDocument;

public sealed class CreateKnowledgeDocumentCommandValidator : AbstractValidator<CreateKnowledgeDocumentCommand>
{
    public CreateKnowledgeDocumentCommandValidator()
    {

        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(30000);
        RuleFor(x => x.Status).Must(x => x is "Draft" or "Published" or "Archived");
    }
}
