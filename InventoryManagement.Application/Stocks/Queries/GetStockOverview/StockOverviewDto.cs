namespace InventoryManagement.Application.Stocks.Queries.GetStockOverview;

public sealed record StockOverviewDto(Guid ProductId, string ProductName, string Sku, long Quantity);
