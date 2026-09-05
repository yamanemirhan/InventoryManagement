using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class WarehouseReadRepository(AppDbContext dbContext)
    : IWarehouseReadRepository
{
    public Task<WarehouseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Warehouses.AsNoTracking().Where(x => x.Id == id)
            .Select(x => new WarehouseDto(x.Id, x.Name, x.Location)).SingleOrDefaultAsync(cancellationToken);

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
