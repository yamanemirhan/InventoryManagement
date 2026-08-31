
namespace InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;

public sealed record WarehouseStockItemDto(Guid ProductId, string ProductName, string Sku, int Quantity);