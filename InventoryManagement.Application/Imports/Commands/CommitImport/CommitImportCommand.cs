using MediatR;
namespace InventoryManagement.Application.Imports.Commands.CommitImport;
public sealed record CommitImportCommand(string Kind, IReadOnlyList<ImportRow> Rows) : IRequest<ImportResult>;
