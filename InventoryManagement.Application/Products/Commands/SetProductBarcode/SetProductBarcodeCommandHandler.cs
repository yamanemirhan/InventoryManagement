using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Codes;
using MediatR;
namespace InventoryManagement.Application.Products.Commands.SetProductBarcode;
public sealed class SetProductBarcodeCommandHandler(ICatalogRepository repository, IProductCodeRepository codes, ICompanyContext company, IUnitOfWork unitOfWork) : IRequestHandler<SetProductBarcodeCommand>
{
    public async Task Handle(SetProductBarcodeCommand request, CancellationToken ct)
    {
        if (company.CompanyId == Guid.Empty || company.Role is not ("Owner" or "Manager")) throw new ForbiddenException();
        var product = await repository.GetProductAsync(request.Id, ct) ?? throw new KeyNotFoundException("Product not found.");
        var barcode = request.Barcode?.Trim();
        if (!string.IsNullOrEmpty(barcode) && await codes.IsUsedAsync(barcode, product.Id, ct)) throw new InvalidOperationException("Barcode or SKU already belongs to another product.");
        product.SetBarcode(barcode); await unitOfWork.SaveChangesAsync(ct);
    }
}
