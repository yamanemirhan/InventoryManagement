using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Import;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class ProductImportRepository(AppDbContext db) : IProductImportRepository
{
    public async Task<IReadOnlyList<string>> ExistingSkusAsync(IReadOnlyList<string> skus, CancellationToken ct)
    {
        var matches = await db.Products.Where(x => skus.Contains(x.SKU) || (x.Barcode != null && skus.Contains(x.Barcode))).Select(x => new { x.SKU, x.Barcode }).ToListAsync(ct);
        return matches.SelectMany(x => new[] { x.SKU, x.Barcode }).Where(x => x != null && skus.Contains(x)).Select(x => x!).Distinct().ToArray();
    }
    public async Task AddAsync(IReadOnlyList<ProductImportRow> rows, CancellationToken ct) => await db.Products.AddRangeAsync(rows.Select(x => new Product(x.Name.Trim(), x.Sku.Trim(), x.Barcode)), ct);
}
