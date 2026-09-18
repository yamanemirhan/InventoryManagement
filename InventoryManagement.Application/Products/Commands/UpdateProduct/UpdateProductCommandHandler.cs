using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler(ICatalogRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<UpdateProductCommand>
{
    public async Task Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var entity = await repository.GetProductAsync(request.Id, ct) ?? throw new KeyNotFoundException("Product not found.");
        entity.Update(request.Name, request.SKU);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
