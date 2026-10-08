namespace InventoryManagement.Application.Imports;

public interface IBulkImportRepository
{
    Task<ImportPreview> PreviewAsync(string kind, IReadOnlyList<ImportRow> rows, CancellationToken ct);
    Task<ImportResult> ImportAsync(string kind, IReadOnlyList<ImportRow> rows, CancellationToken ct);
}
