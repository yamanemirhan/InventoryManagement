using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Workspace.Queries;
namespace InventoryManagement.Application.Common.Interfaces;

public interface IWorkspaceReadRepository
{
    Task<DashboardDto> GetDashboardAsync(CancellationToken ct);
    Task<PagedResult<ActivityDto>> GetActivityAsync(int page, CancellationToken ct);
    Task<PagedResult<KnowledgeListItemDto>> GetDocumentsAsync(int page, string search, bool includeDrafts, CancellationToken ct);
    Task<KnowledgeDocumentDto?> GetDocumentAsync(Guid id, bool includeDrafts, CancellationToken ct);
}
