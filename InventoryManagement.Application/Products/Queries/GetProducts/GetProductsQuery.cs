
using MediatR;

namespace InventoryManagement.Application.Products.Queries.GetProducts;

public sealed record GetProductsQuery : IRequest<IReadOnlyList<ProductListItemDto>>;
