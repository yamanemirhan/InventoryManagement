
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockMovementRepository(AppDbContext dbContext) : IStockMovementRepository
{
    public async Task AddAsync(StockMovement movement, CancellationToken cancellationToken = default)
    {
        await dbContext.StockMovements.AddAsync(movement, cancellationToken);
    }
}