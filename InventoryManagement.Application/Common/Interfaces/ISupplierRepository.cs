using InventoryManagement.Domain.Entities;
using InventoryManagement.Application.Suppliers.Queries;
namespace InventoryManagement.Application.Common.Interfaces;
public interface ISupplierRepository
{
    Task AddAsync(Supplier supplier, CancellationToken cancellationToken);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken);
    Task<IReadOnlyList<SupplierDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<SupplierDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
