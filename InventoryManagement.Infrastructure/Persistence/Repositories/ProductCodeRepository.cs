using InventoryManagement.Application.Products.Codes;
using InventoryManagement.Application.Products.Queries.GetProductById;
using Microsoft.EntityFrameworkCore;
using InventoryManagement.Domain.Common;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class ProductCodeRepository(AppDbContext db) : IProductCodeRepository
{
    public async Task<IReadOnlyList<ProductDto>> FindAsync(IReadOnlyList<string> codes, CancellationToken ct) =>
        await db.Products.AsNoTracking().Where(x => !x.IsDeleted && (codes.Contains(x.SKU) || (x.Barcode != null && codes.Contains(x.Barcode))))
            .Select(x => new ProductDto(x.Id, x.Name, x.SKU, x.Barcode)).Take(2).ToListAsync(ct);
    public Task<bool> IsUsedAsync(string code, Guid? exceptProductId, CancellationToken ct)
    {
        var variants = BarcodeRules.Variants(code);
        return db.Products.AnyAsync(x => (!exceptProductId.HasValue || x.Id != exceptProductId) &&
            (variants.Contains(x.SKU) || (x.Barcode != null && variants.Contains(x.Barcode))), ct);
    }
}
