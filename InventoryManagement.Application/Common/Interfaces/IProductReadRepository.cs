using InventoryManagement.Application.Products.Queries.GetProducts;
using InventoryManagement.Application.Products.Queries.GetProductById;
namespace InventoryManagement.Application.Common.Interfaces;
public interface IProductReadRepository
{
    Task<IReadOnlyList<ProductListItemDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
