
namespace InventoryManagement.Application.Products.Queries.GetProductById;

public sealed record ProductDto(Guid Id, string Name, string Sku, string? Barcode = null);
