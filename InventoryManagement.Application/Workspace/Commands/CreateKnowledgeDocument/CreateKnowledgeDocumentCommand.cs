using MediatR;
namespace InventoryManagement.Application.Workspace.Commands.CreateKnowledgeDocument;

public sealed record CreateKnowledgeDocumentCommand(string Title, string Content, string Status) : IRequest<Guid>;
