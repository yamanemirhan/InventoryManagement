using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Products.Queries.GetProducts;
public sealed class GetProductsQueryHandler(IProductReadRepository repository) : IRequestHandler<GetProductsQuery, IReadOnlyList<ProductListItemDto>>
{
    public Task<IReadOnlyList<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken ct) => repository.GetAllAsync(ct);
}
