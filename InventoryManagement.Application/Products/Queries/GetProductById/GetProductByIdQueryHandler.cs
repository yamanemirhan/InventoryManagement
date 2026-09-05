using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Products.Queries.GetProductById;
public sealed class GetProductByIdQueryHandler(IProductReadRepository repository) : IRequestHandler<GetProductByIdQuery, ProductDto?>
{
    public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken ct) =>
        await repository.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Product not found.");
}
