using MediatR;
using InventoryManagement.Application.Products.Import;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Products.Commands.ImportProducts;

public sealed class ImportProductsCommandHandler(ProductImportValidation validation, IProductImportRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<ImportProductsCommand, int>
{
    public async Task<int> Handle(ImportProductsCommand request, CancellationToken ct)
    {
        var preview = await validation.CheckAsync(request.Rows, ct);
        if (preview.Errors.Count > 0) throw new InventoryManagement.Domain.Exceptions.DomainException(string.Join("; ", preview.Errors.Take(10)));
        await repository.AddAsync(request.Rows, ct); await unitOfWork.SaveChangesAsync(ct); return preview.RowCount;
    }
}
