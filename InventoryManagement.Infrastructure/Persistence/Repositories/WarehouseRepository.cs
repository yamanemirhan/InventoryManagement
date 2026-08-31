
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class WarehouseRepository(AppDbContext dbContext) : IWarehouseRepository
{
    public async Task AddAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
    {
        await dbContext.Warehouses.AddAsync(warehouse, cancellationToken);
    }
}