namespace InventoryManagement.Application.Workspace.Queries;

public sealed record DashboardDto(int Products, int Warehouses, int Suppliers, long UnitsInStock, int OpenOrders, int OutOfStockProducts, int PublishedDocuments);
