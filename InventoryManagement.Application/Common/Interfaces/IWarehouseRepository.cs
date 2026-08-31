
using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Application.Common.Interfaces;

public interface IWarehouseRepository
{
    Task AddAsync(Warehouse warehouse, CancellationToken cancellationToken = default);
}