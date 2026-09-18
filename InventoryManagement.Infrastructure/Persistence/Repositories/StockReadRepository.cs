using InventoryManagement.Application.Stocks.Queries.GetStockOverview;
﻿
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockReadRepository(AppDbContext dbContext) : IStockReadRepository
{
    public async Task<IReadOnlyList<StockOverviewDto>> GetOverviewAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Products.AsNoTracking().Where(p => !p.IsDeleted).OrderBy(p => p.Name).ThenBy(p => p.Id)
            .Select(p => new StockOverviewDto(
                p.Id, p.Name, p.SKU, dbContext.Stocks.Where(s => s.ProductId == p.Id).Sum(s => (long)s.Quantity)))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<WarehouseStockItemDto>> GetWarehouseStockAsync(Guid warehouseId, CancellationToken cancellationToken = default)
    {
        if (!await dbContext.Warehouses.AnyAsync(x => x.Id == warehouseId, cancellationToken))
            throw new KeyNotFoundException("Warehouse not found.");
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
