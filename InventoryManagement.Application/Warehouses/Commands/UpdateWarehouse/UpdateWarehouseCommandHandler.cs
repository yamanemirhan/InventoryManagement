using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Warehouses.Commands.UpdateWarehouse;

public sealed class UpdateWarehouseCommandHandler(ICatalogRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<UpdateWarehouseCommand>
{
    public async Task Handle(UpdateWarehouseCommand request, CancellationToken ct)
    {
        var entity = await repository.GetWarehouseAsync(request.Id, ct) ?? throw new KeyNotFoundException("Warehouse not found.");
        entity.Update(request.Name, request.Location);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
