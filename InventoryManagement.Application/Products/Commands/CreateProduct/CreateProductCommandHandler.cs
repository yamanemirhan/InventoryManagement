
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Application.Products.Codes;
using MediatR;

namespace InventoryManagement.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandHandler(IProductRepository productRepository, IUnitOfWork unitOfWork, IProductCodeRepository? codes = null) : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var exists = await productRepository.ExistsBySkuAsync(request.Sku.Trim(), cancellationToken);
        if (exists) throw new InvalidOperationException("SKU already exists.");
        if (codes is not null && (await codes.IsUsedAsync(request.Sku.Trim(), null, cancellationToken) ||
            (!string.IsNullOrWhiteSpace(request.Barcode) && await codes.IsUsedAsync(request.Barcode.Trim(), null, cancellationToken))))
            throw new InvalidOperationException("Barcode or SKU already belongs to another product.");
        var product = new Product(request.Name, request.Sku, request.Barcode);

        await productRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}
