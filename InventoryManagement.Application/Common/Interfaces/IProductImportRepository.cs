using InventoryManagement.Application.Products.Import;
namespace InventoryManagement.Application.Common.Interfaces;

public interface IProductImportRepository
{
    Task<IReadOnlyList<string>> ExistingSkusAsync(IReadOnlyList<string> skus, CancellationToken ct);
    Task AddAsync(IReadOnlyList<ProductImportRow> rows, CancellationToken ct);
}
