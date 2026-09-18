using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Import;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class ProductImportRepository(AppDbContext db) : IProductImportRepository
{
    public async Task<IReadOnlyList<string>> ExistingSkusAsync(IReadOnlyList<string> skus, CancellationToken ct) => await db.Products.Where(x => skus.Contains(x.SKU)).Select(x => x.SKU).ToListAsync(ct);
    public async Task AddAsync(IReadOnlyList<ProductImportRow> rows, CancellationToken ct) => await db.Products.AddRangeAsync(rows.Select(x => new Product(x.Name.Trim(), x.Sku.Trim())), ct);
}
