using InventoryManagement.Domain.Entities;
namespace InventoryManagement.Application.Common.Interfaces;

public interface IStockCountRepository { Task AddAsync(StockCount count, CancellationToken ct); }
