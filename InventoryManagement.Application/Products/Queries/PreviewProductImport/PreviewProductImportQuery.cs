using MediatR;
using InventoryManagement.Application.Products.Import;
namespace InventoryManagement.Application.Products.Queries.PreviewProductImport;

public sealed record PreviewProductImportQuery(IReadOnlyList<ProductImportRow> Rows) : IRequest<ProductImportPreview>;
