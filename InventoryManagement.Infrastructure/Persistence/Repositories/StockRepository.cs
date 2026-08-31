
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockRepository(AppDbContext dbContext) : IStockRepository
{
    public Task<Stock?> GetAsync(Guid productId, Guid warehouseId, CancellationToken cancellationToken = default)
    {
        return dbContext.Stocks.FirstOrDefaultAsync(
                x => x.ProductId == productId &&
                     x.WarehouseId == warehouseId,
                cancellationToken);
    }

    public async Task AddAsync(Stock stock, CancellationToken cancellationToken = default)
    {
        await dbContext.Stocks.AddAsync(stock, cancellationToken);
    }
}