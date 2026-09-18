using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Workspace.Queries;
using InventoryManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class WorkspaceReadRepository(AppDbContext db) : IWorkspaceReadRepository
{
    public async Task<DashboardDto> GetDashboardAsync(CancellationToken ct) => new(
        await db.Products.CountAsync(x => !x.IsDeleted, ct),
        await db.Warehouses.CountAsync(ct), await db.Suppliers.CountAsync(ct),
        await db.Stocks.SumAsync(x => (long)x.Quantity, ct),
        await db.PurchaseOrders.CountAsync(x => x.Status == PurchaseOrderStatus.Draft || x.Status == PurchaseOrderStatus.Ordered || x.Status == PurchaseOrderStatus.PartiallyReceived, ct),
        await db.Products.CountAsync(x => !x.IsDeleted && !db.Stocks.Any(s => s.ProductId == x.Id && s.Quantity > 0), ct),
        await db.KnowledgeDocuments.CountAsync(x => x.Status == "Published", ct));
    public async Task<PagedResult<ActivityDto>> GetActivityAsync(int page, CancellationToken ct)
    {
        var query = db.ActivityEntries.AsNoTracking();
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * 20).Take(20)
            .Select(x => new ActivityDto(x.Id, x.EntityType, x.EntityId, x.Action, x.ActorSubjectId, x.CreatedAtUtc)).ToListAsync(ct);
        return new(items, total, page, 20);
    }
    public async Task<PagedResult<KnowledgeListItemDto>> GetDocumentsAsync(int page, string search, bool includeDrafts, CancellationToken ct)
    {
        var query = db.KnowledgeDocuments.AsNoTracking().Where(x => includeDrafts || x.Status == "Published");
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Title.ToLower().Contains(search.Trim().ToLower()));
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.UpdatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * 20).Take(20)
            .Select(x => new KnowledgeListItemDto(x.Id, x.Title, x.Status, x.Revision, x.UpdatedAtUtc)).ToListAsync(ct);
        return new(items, total, page, 20);
    }
    public Task<KnowledgeDocumentDto?> GetDocumentAsync(Guid id, bool includeDrafts, CancellationToken ct) =>
        db.KnowledgeDocuments.AsNoTracking().Where(x => x.Id == id && (includeDrafts || x.Status == "Published"))
            .Select(x => new KnowledgeDocumentDto(x.Id, x.Title, x.Content, x.Status, x.Revision, x.CreatedAtUtc, x.UpdatedAtUtc)).SingleOrDefaultAsync(ct);
}
