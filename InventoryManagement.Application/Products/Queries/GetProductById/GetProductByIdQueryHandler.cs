
using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Products.Queries.GetProductById;

public sealed class GetProductByIdQueryHandler(IProductRepository productRepository) : IRequestHandler<GetProductByIdQuery, ProductDto?>
{
    public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.Id, cancellationToken);

        if (product is null || product.IsDeleted)
            throw new KeyNotFoundException($"Product with ID {request.Id} not found.");

        return new ProductDto(product.Id, product.Name, product.SKU);
    }
}
