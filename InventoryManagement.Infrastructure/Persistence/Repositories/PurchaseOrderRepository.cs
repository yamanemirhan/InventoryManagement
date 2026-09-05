using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class PurchaseOrderRepository(AppDbContext db) : IPurchaseOrderRepository
{
    public async Task AddAsync(PurchaseOrder order, CancellationToken ct) => await db.PurchaseOrders.AddAsync(order, ct);
    public Task<PurchaseOrder?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.PurchaseOrders.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id, ct);
}
