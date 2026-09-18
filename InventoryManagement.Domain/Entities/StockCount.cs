using InventoryManagement.Domain.Common;
namespace InventoryManagement.Domain.Entities;

public sealed class StockCount : CompanyEntity
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int PreviousQuantity { get; set; }
    public int CountedQuantity { get; set; }
    public string Reason { get; set; } = "";
    public string ActorSubjectId { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
