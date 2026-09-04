using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class WarehouseReadRepository(AppDbContext dbContext)
    : IWarehouseReadRepository
{
    public async Task<IReadOnlyList<WarehouseDto>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Warehouses
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new WarehouseDto(
                x.Id,
                x.Name,
                x.Location))
            .ToListAsync(cancellationToken);
    }
}