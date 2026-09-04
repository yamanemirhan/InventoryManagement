using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IWarehouseReadRepository
{
    Task<IReadOnlyList<WarehouseDto>> GetAllAsync(
        CancellationToken cancellationToken = default);
}