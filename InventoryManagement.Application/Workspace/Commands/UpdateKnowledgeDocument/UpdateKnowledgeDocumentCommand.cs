using MediatR;
namespace InventoryManagement.Application.Workspace.Commands.UpdateKnowledgeDocument;

public sealed record UpdateKnowledgeDocumentCommand(Guid Id, int Revision, string Title, string Content, string Status) : IRequest<Guid>;
