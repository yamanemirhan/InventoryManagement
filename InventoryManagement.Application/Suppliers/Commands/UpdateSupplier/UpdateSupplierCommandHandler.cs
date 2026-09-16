using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Commands.UpdateSupplier;

public sealed class UpdateSupplierCommandHandler(ICatalogRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<UpdateSupplierCommand>
{
    public async Task Handle(UpdateSupplierCommand request, CancellationToken ct)
    {
        var entity = await repository.GetSupplierAsync(request.Id, ct) ?? throw new KeyNotFoundException("Supplier not found.");
        entity.Update(request.Name, request.Email);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
