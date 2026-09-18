using MediatR;
using InventoryManagement.Application.Products.Import;
namespace InventoryManagement.Application.Products.Commands.ImportProducts;

public sealed record ImportProductsCommand(IReadOnlyList<ProductImportRow> Rows) : IRequest<int>;
