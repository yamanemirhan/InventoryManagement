using MediatR;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Imports.Queries.PreviewImport;
public sealed class PreviewImportQueryHandler(IBulkImportRepository repository, ICompanyContext company) : IRequestHandler<PreviewImportQuery, ImportPreview>
{
    public Task<ImportPreview> Handle(PreviewImportQuery request, CancellationToken ct)
    { ImportRules.RequireAccess(company); ImportRules.RequireRequest(request.Kind, request.Rows); return repository.PreviewAsync(request.Kind, request.Rows, ct); }
}
