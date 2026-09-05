using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.PurchaseOrders.Queries;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;
public sealed class PurchaseOrderReadRepository(AppDbContext db) : IPurchaseOrderReadRepository
{
    public async Task<PagedResult<PurchaseOrderListItemDto>> GetPageAsync(int page, int pageSize, CancellationToken ct)
    {
        var count = await db.PurchaseOrders.CountAsync(ct);
        var items = await (from order in db.PurchaseOrders.AsNoTracking()
            join supplier in db.Suppliers on order.SupplierId equals supplier.Id
            join warehouse in db.Warehouses on order.WarehouseId equals warehouse.Id
            orderby order.CreatedAtUtc descending, order.Id descending
            select new PurchaseOrderListItemDto(order.Id, order.SupplierId, supplier.Name, order.WarehouseId, warehouse.Name,
                order.Status, order.CreatedAtUtc, order.Items.Count, order.Items.Sum(i => i.Quantity * i.UnitPrice)))
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new(items, count, page, pageSize);
    }
    public Task<PurchaseOrderDto?> GetByIdAsync(Guid id, CancellationToken ct) =>
        (from order in db.PurchaseOrders.AsNoTracking()
         join supplier in db.Suppliers on order.SupplierId equals supplier.Id
         join warehouse in db.Warehouses on order.WarehouseId equals warehouse.Id
         where order.Id == id
         select new PurchaseOrderDto(order.Id, order.SupplierId, supplier.Name, order.WarehouseId, warehouse.Name,
             order.Status, order.CreatedAtUtc, order.Items.Sum(i => i.Quantity * i.UnitPrice),
             (from item in order.Items
              join product in db.Products on item.ProductId equals product.Id
              orderby product.Name, product.Id
              select new PurchaseOrderItemDto(product.Id, product.Name, product.SKU, item.Quantity, item.UnitPrice, item.Quantity * item.UnitPrice)).ToList()))
        .SingleOrDefaultAsync(ct);
}
