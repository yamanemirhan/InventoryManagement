using MediatR;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Commands.UpdateKnowledgeDocument;

public sealed class UpdateKnowledgeDocumentCommandHandler(IKnowledgeRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<UpdateKnowledgeDocumentCommand, Guid>
{
    public async Task<Guid> Handle(UpdateKnowledgeDocumentCommand request, CancellationToken ct)
    {
        var document = await repository.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Document not found.");
        if (document.Revision != request.Revision) throw new InvalidOperationException("This document has changed. Reload before saving.");
        document.Update(request.Title, request.Content, request.Status);
        await unitOfWork.SaveChangesAsync(ct);
        return document.Id;
    }
}
