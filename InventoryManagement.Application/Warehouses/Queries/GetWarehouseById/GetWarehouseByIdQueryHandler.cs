using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;
using MediatR;
namespace InventoryManagement.Application.Warehouses.Queries.GetWarehouseById;

public sealed class GetWarehouseByIdQueryHandler(IWarehouseReadRepository repository) : IRequestHandler<GetWarehouseByIdQuery, WarehouseDto>
{
    public async Task<WarehouseDto> Handle(GetWarehouseByIdQuery request, CancellationToken ct) =>
        await repository.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Warehouse not found.");
}
