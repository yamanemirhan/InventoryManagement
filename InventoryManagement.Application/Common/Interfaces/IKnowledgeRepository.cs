using InventoryManagement.Domain.Entities;
namespace InventoryManagement.Application.Common.Interfaces;

public interface IKnowledgeRepository
{
    Task AddAsync(KnowledgeDocument document, CancellationToken ct);
    Task<KnowledgeDocument?> GetByIdAsync(Guid id, CancellationToken ct);
}
