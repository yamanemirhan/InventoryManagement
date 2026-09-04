using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockMovementReadRepository(AppDbContext dbContext)
    : IStockMovementReadRepository
{
    public async Task<IReadOnlyList<StockMovementDto>> GetHistoryAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from movement in dbContext.StockMovements.AsNoTracking()
            join product in dbContext.Products.AsNoTracking()
                on movement.ProductId equals product.Id
            where movement.WarehouseId == warehouseId
            orderby movement.CreatedAtUtc descending
            select new StockMovementDto(
                movement.Id,
                product.Id,
                product.Name,
                product.SKU,
                movement.Type,
                movement.Quantity,
                movement.WarehouseId,
                movement.RelatedWarehouseId,
                movement.CreatedAtUtc)
        ).ToListAsync(cancellationToken);
    }
}