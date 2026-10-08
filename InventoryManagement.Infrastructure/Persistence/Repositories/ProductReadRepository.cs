using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Queries.GetProducts;
using InventoryManagement.Application.Products.Queries.GetProductById;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class ProductReadRepository(AppDbContext db) : IProductReadRepository
{
    public async Task<IReadOnlyList<ProductListItemDto>> GetAllAsync(CancellationToken ct) =>
        await db.Products.AsNoTracking().Where(x => !x.IsDeleted).OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Select(x => new ProductListItemDto(x.Id, x.Name, x.SKU, x.Barcode)).ToListAsync(ct);
    public Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.Products.AsNoTracking().Where(x => x.Id == id && !x.IsDeleted).Select(x => new ProductDto(x.Id, x.Name, x.SKU, x.Barcode)).SingleOrDefaultAsync(ct);
}
