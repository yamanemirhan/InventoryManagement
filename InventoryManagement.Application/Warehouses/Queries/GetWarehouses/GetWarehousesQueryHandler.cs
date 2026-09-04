using InventoryManagement.Application.Common.Interfaces;
using MediatR;

namespace InventoryManagement.Application.Warehouses.Queries.GetWarehouses;

public sealed class GetWarehousesQueryHandler(IWarehouseReadRepository repository)
    : IRequestHandler<GetWarehousesQuery, IReadOnlyList<WarehouseDto>>
{
    public Task<IReadOnlyList<WarehouseDto>> Handle(
        GetWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        return repository.GetAllAsync(cancellationToken);
    }
}