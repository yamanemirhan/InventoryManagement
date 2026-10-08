using InventoryManagement.Application.Products.Queries.GetProductById;
namespace InventoryManagement.Application.Products.Codes;
public interface IProductCodeRepository
{
    Task<IReadOnlyList<ProductDto>> FindAsync(IReadOnlyList<string> codes, CancellationToken ct);
    Task<bool> IsUsedAsync(string code, Guid? exceptProductId, CancellationToken ct);
}
