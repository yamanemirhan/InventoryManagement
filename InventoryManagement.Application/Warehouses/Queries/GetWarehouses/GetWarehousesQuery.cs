using MediatR;

namespace InventoryManagement.Application.Warehouses.Queries.GetWarehouses;

public sealed record GetWarehousesQuery()
    : IRequest<IReadOnlyList<WarehouseDto>>;