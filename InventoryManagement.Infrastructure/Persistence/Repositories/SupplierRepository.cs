using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Suppliers.Queries;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class SupplierRepository(AppDbContext db) : ISupplierRepository
{
    public async Task AddAsync(Supplier supplier, CancellationToken ct) => await db.Suppliers.AddAsync(supplier, ct);
    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct) => db.Suppliers.AnyAsync(x => x.Email.ToLower() == email, ct);
    public async Task<IReadOnlyList<SupplierDto>> GetAllAsync(CancellationToken ct) =>
        await db.Suppliers.AsNoTracking().OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Select(x => new SupplierDto(x.Id, x.Name, x.Email)).ToListAsync(ct);
    public Task<SupplierDto?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.Suppliers.AsNoTracking().Where(x => x.Id == id).Select(x => new SupplierDto(x.Id, x.Name, x.Email)).SingleOrDefaultAsync(ct);
}
