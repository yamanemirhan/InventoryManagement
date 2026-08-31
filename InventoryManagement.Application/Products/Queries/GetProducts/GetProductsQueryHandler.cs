
using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Products.Queries.GetProducts;

public sealed class GetProductsQueryHandler(IProductRepository productRepository) : IRequestHandler<GetProductsQuery, IReadOnlyList<ProductListItemDto>>
{
    public async Task<IReadOnlyList<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await productRepository.GetAllAsync(cancellationToken);

        return products.Select(x => new ProductListItemDto(x.Id, x.Name, x.SKU)).ToList();
    }
}