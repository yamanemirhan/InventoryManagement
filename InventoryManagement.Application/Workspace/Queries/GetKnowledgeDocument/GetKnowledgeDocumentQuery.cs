using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocument;

public sealed record GetKnowledgeDocumentQuery(Guid Id) : IRequest<KnowledgeDocumentDto>;
