using MediatR;
namespace InventoryManagement.Application.Imports.Queries.PreviewImport;
public sealed record PreviewImportQuery(string Kind, IReadOnlyList<ImportRow> Rows) : IRequest<ImportPreview>;
