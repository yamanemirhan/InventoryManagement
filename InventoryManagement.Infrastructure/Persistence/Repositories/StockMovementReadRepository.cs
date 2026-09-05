using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class StockMovementReadRepository(AppDbContext db) : IStockMovementReadRepository
{
    private IQueryable<StockMovementDto> History(Guid warehouseId) =>
        from movement in db.StockMovements.AsNoTracking()
        join product in db.Products.AsNoTracking() on movement.ProductId equals product.Id
        where movement.WarehouseId == warehouseId || movement.RelatedWarehouseId == warehouseId
        orderby movement.CreatedAtUtc descending, movement.Id descending
        select new StockMovementDto(movement.Id, product.Id, product.Name, product.SKU, movement.Type,
            movement.Quantity, movement.WarehouseId, movement.RelatedWarehouseId, movement.CreatedAtUtc);
    private async Task EnsureWarehouseExists(Guid id, CancellationToken ct)
    {
        if (!await db.Warehouses.AnyAsync(x => x.Id == id, ct)) throw new KeyNotFoundException("Warehouse not found.");
    }
    public async Task<IReadOnlyList<StockMovementDto>> GetHistoryAsync(Guid warehouseId, CancellationToken cancellationToken = default)
    {
        await EnsureWarehouseExists(warehouseId, cancellationToken);
        return await History(warehouseId).ToListAsync(cancellationToken);
    }
    public async Task<PagedResult<StockMovementDto>> GetPageAsync(Guid warehouseId, int page, int pageSize, CancellationToken ct)
    {
        await EnsureWarehouseExists(warehouseId, ct);
        var query = History(warehouseId);
        var count = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new(items, count, page, pageSize);
    }
}
