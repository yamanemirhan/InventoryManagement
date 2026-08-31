
using MediatR;

namespace InventoryManagement.Application.Products.Commands.CreateProduct;

public sealed record CreateProductCommand(string Name, string Sku) : IRequest<Guid>;