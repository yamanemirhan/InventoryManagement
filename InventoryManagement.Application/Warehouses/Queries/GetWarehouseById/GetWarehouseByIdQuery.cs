using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;
using MediatR;
namespace InventoryManagement.Application.Warehouses.Queries.GetWarehouseById;

public sealed record GetWarehouseByIdQuery(Guid Id) : IRequest<WarehouseDto>;
