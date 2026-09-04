namespace InventoryManagement.Application.Warehouses.Queries.GetWarehouses;

public sealed record WarehouseDto(
    Guid Id,
    string Name,
    string Location);