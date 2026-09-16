using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocuments;

public sealed class GetKnowledgeDocumentsQueryHandler(IWorkspaceReadRepository repository, ICompanyContext company) : IRequestHandler<GetKnowledgeDocumentsQuery, PagedResult<KnowledgeListItemDto>>
{
    public async Task<PagedResult<KnowledgeListItemDto>> Handle(GetKnowledgeDocumentsQuery request, CancellationToken ct) { return await repository.GetDocumentsAsync(request.Page, request.Search, company.Role is "Owner" or "Manager", ct); }
}
