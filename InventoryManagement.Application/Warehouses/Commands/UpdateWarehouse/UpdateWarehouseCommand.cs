using MediatR;
namespace InventoryManagement.Application.Warehouses.Commands.UpdateWarehouse;

public sealed record UpdateWarehouseCommand(Guid Id, string Name, string Location) : IRequest;
