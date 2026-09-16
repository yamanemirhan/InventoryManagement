using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocuments;

public sealed record GetKnowledgeDocumentsQuery(int Page = 1, string Search = "") : IRequest<PagedResult<KnowledgeListItemDto>>;
