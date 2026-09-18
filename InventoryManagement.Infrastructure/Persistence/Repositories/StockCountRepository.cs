using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class StockCountRepository(AppDbContext db) : IStockCountRepository
{
    public async Task AddAsync(StockCount count, CancellationToken ct) => await db.StockCounts.AddAsync(count, ct);
}
