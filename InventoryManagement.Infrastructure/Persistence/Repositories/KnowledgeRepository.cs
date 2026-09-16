using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class KnowledgeRepository(AppDbContext db) : IKnowledgeRepository
{
    public async Task AddAsync(KnowledgeDocument document, CancellationToken ct) => await db.KnowledgeDocuments.AddAsync(document, ct);
    public Task<KnowledgeDocument?> GetByIdAsync(Guid id, CancellationToken ct) => db.KnowledgeDocuments.SingleOrDefaultAsync(x => x.Id == id, ct);
}
