
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;

namespace InventoryManagement.Application.Warehouses.Commands.CreateWarehouse;

public sealed class CreateWarehouseCommandHandler(IWarehouseRepository warehouseRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<CreateWarehouseCommand, Guid>
{
    public async Task<Guid> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = new Warehouse(request.Name, request.Location);

        await warehouseRepository.AddAsync(warehouse, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return warehouse.Id;
    }
}
