using MediatR;
using InventoryManagement.Application.Products.Import;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Products.Queries.PreviewProductImport;

public sealed class PreviewProductImportQueryHandler(ProductImportValidation validation) : IRequestHandler<PreviewProductImportQuery, ProductImportPreview>
{ public async Task<ProductImportPreview> Handle(PreviewProductImportQuery request, CancellationToken ct) { return await validation.CheckAsync(request.Rows, ct); } }
