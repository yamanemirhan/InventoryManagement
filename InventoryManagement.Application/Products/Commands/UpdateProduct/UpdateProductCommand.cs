using MediatR;
namespace InventoryManagement.Application.Products.Commands.UpdateProduct;

public sealed record UpdateProductCommand(Guid Id, string Name, string SKU) : IRequest;
