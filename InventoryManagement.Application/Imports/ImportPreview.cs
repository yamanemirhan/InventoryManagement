namespace InventoryManagement.Application.Imports;

public sealed record ImportError(int Row, string Column, string Message);
public sealed record ImportPreview(int RowCount, IReadOnlyList<ImportError> Errors, bool AlreadyImported = false);
public sealed record ImportResult(int Records, bool AlreadyImported);
