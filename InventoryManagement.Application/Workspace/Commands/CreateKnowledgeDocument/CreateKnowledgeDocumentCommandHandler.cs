using MediatR;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Commands.CreateKnowledgeDocument;

public sealed class CreateKnowledgeDocumentCommandHandler(IKnowledgeRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<CreateKnowledgeDocumentCommand, Guid>
{
    public async Task<Guid> Handle(CreateKnowledgeDocumentCommand request, CancellationToken ct)
    {
        var document = new KnowledgeDocument(request.Title, request.Content, request.Status);
        await repository.AddAsync(document, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return document.Id;
    }
}
