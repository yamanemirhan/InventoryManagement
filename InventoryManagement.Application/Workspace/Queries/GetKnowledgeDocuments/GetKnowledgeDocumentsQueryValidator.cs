using FluentValidation;
namespace InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocuments;

public sealed class GetKnowledgeDocumentsQueryValidator : AbstractValidator<GetKnowledgeDocumentsQuery>
{
    public GetKnowledgeDocumentsQueryValidator()
    {
        RuleFor(x => x.Page).InclusiveBetween(1, 1000000);
        RuleFor(x => x.Search).MaximumLength(200);
    }
}
