using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Codes;
using MediatR;
namespace InventoryManagement.Application.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler(ICatalogRepository repository, IUnitOfWork unitOfWork, IProductCodeRepository? codes = null) : IRequestHandler<UpdateProductCommand>
{
    public async Task Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var entity = await repository.GetProductAsync(request.Id, ct) ?? throw new KeyNotFoundException("Product not found.");
        if (codes is not null && await codes.IsUsedAsync(request.SKU.Trim(), request.Id, ct))
            throw new InvalidOperationException("Barcode or SKU already belongs to another product.");
        entity.Update(request.Name, request.SKU);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
