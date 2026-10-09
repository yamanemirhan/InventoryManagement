using InventoryManagement.Application.Products.Queries.GetProductById;
using MediatR;
namespace InventoryManagement.Application.Products.Queries.GetProductByCode;
public sealed record GetProductByCodeQuery(string Code) : IRequest<ProductDto?>;
