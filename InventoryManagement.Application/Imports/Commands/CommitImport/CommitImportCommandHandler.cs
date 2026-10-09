using MediatR;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Imports.Commands.CommitImport;
public sealed class CommitImportCommandHandler(IBulkImportRepository repository, ICompanyContext company) : IRequestHandler<CommitImportCommand, ImportResult>
{
    public Task<ImportResult> Handle(CommitImportCommand request, CancellationToken ct)
    { ImportRules.RequireAccess(company); ImportRules.RequireRequest(request.Kind, request.Rows); return repository.ImportAsync(request.Kind, request.Rows, ct); }
}
