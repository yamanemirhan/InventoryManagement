using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class CatalogRepository(AppDbContext db) : ICatalogRepository
{
    public Task<Product?> GetProductAsync(Guid id, CancellationToken ct) => db.Products.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
    public Task<Warehouse?> GetWarehouseAsync(Guid id, CancellationToken ct) => db.Warehouses.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<Supplier?> GetSupplierAsync(Guid id, CancellationToken ct) => db.Suppliers.SingleOrDefaultAsync(x => x.Id == id, ct);
}
