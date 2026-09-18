using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocument;

public sealed class GetKnowledgeDocumentQueryHandler(IWorkspaceReadRepository repository, ICompanyContext company) : IRequestHandler<GetKnowledgeDocumentQuery, KnowledgeDocumentDto>
{
    public async Task<KnowledgeDocumentDto> Handle(GetKnowledgeDocumentQuery request, CancellationToken ct) { return await repository.GetDocumentAsync(request.Id, company.Role is "Owner" or "Manager", ct) ?? throw new KeyNotFoundException("Document not found."); }
}
