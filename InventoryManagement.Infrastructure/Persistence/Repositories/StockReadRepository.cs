
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockReadRepository(AppDbContext dbContext) : IStockReadRepository
{
    public async Task<IReadOnlyList<WarehouseStockItemDto>> GetWarehouseStockAsync(Guid warehouseId, CancellationToken cancellationToken = default)
    {
        return await (
            from stock in dbContext.Stocks.AsNoTracking()
            join product in dbContext.Products.AsNoTracking()
                on stock.ProductId equals product.Id
            where stock.WarehouseId == warehouseId && !product.IsDeleted
            orderby product.Name
            select new WarehouseStockItemDto(
                product.Id,
                product.Name,
                product.SKU,
                stock.Quantity)
        ).ToListAsync(cancellationToken);
    }
}