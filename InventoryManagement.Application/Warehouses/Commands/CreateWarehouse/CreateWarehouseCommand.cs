

using MediatR;

namespace InventoryManagement.Application.Warehouses.Commands.CreateWarehouse;

public sealed record CreateWarehouseCommand(string Name, string Location) : IRequest<Guid>;
