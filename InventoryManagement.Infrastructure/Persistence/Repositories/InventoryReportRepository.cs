using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Reports.Queries;
using InventoryManagement.Application.Reports.Queries.GetStockReport;
using InventoryManagement.Application.Reports.Queries.GetMovementReport;
using InventoryManagement.Application.Reports.Queries.GetCountReport;
using Microsoft.EntityFrameworkCore;
namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class InventoryReportRepository(AppDbContext db) : IInventoryReportRepository
{
    public async Task<PagedResult<StockReportRow>> GetStockReportAsync(GetStockReportQuery request, CancellationToken ct)
    {
        var query = from p in db.Products.AsNoTracking()
                    from w in db.Warehouses.AsNoTracking()
                    join s in db.Stocks.AsNoTracking() on new { ProductId = p.Id, WarehouseId = w.Id } equals new { s.ProductId, s.WarehouseId } into stocks
                    from s in stocks.DefaultIfEmpty()
                    where !p.IsDeleted && (request.WarehouseId == null ? s != null : w.Id == request.WarehouseId)
                    select new { ProductId = p.Id, ProductName = p.Name, Sku = p.SKU, WarehouseId = w.Id, WarehouseName = w.Name, Quantity = s == null ? 0 : s.Quantity, MinimumQuantity = s == null ? 0 : s.MinimumQuantity, Version = s == null ? 0 : s.Version };
        if (!string.IsNullOrWhiteSpace(request.Search)) { var search = request.Search.Trim().ToLower(); query = query.Where(x => x.ProductName.ToLower().Contains(search) || x.Sku.ToLower().Contains(search)); }
        if (request.LowOnly) query = query.Where(x => x.MinimumQuantity > 0 && x.Quantity < x.MinimumQuantity);
        var count = await query.CountAsync(ct);
        var rows = await query.OrderBy(x => x.ProductName).ThenBy(x => x.ProductId).ThenBy(x => x.WarehouseId).Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).Select(x => new StockReportRow(x.ProductId, x.ProductName, x.Sku, x.WarehouseId, x.WarehouseName, x.Quantity, x.MinimumQuantity, x.Version)).ToListAsync(ct);
        return new(rows, count, request.Page, request.PageSize);
    }
    public async Task<PagedResult<MovementReportRow>> GetMovementReportAsync(GetMovementReportQuery request, CancellationToken ct)
    {
        var query = from m in db.StockMovements.AsNoTracking()
                    join p in db.Products on m.ProductId equals p.Id
                    join w in db.Warehouses on m.WarehouseId equals w.Id
                    join rw in db.Warehouses on m.RelatedWarehouseId equals rw.Id into related
                    from rw in related.DefaultIfEmpty()
                    where (request.WarehouseId == null || m.WarehouseId == request.WarehouseId || m.RelatedWarehouseId == request.WarehouseId)
                     && (request.From == null || m.CreatedAtUtc >= request.From) && (request.To == null || m.CreatedAtUtc < request.To)
                    select new { m.Id, ProductName = p.Name, Sku = p.SKU, WarehouseName = w.Name, RelatedWarehouseName = rw == null ? null : rw.Name, m.Type, m.Quantity, m.SignedDelta, m.Reason, m.PurchaseOrderId, m.CreatedAtUtc };
        if (!string.IsNullOrWhiteSpace(request.Search)) { var search = request.Search.Trim().ToLower(); query = query.Where(x => x.ProductName.ToLower().Contains(search) || x.Sku.ToLower().Contains(search)); }
        var count = await query.CountAsync(ct); var rows = await query.OrderByDescending(x => x.CreatedAtUtc).ThenBy(x => x.Id).Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).Select(x => new MovementReportRow(x.Id, x.ProductName, x.Sku, x.WarehouseName, x.RelatedWarehouseName, x.Type, x.Quantity, x.SignedDelta, x.Reason, x.PurchaseOrderId, x.CreatedAtUtc)).ToListAsync(ct);
        return new(rows, count, request.Page, request.PageSize);
    }
    public async Task<PagedResult<CountReportRow>> GetCountReportAsync(GetCountReportQuery request, CancellationToken ct)
    {
        var query = from c in db.StockCounts.AsNoTracking()
                    join p in db.Products on c.ProductId equals p.Id
                    join w in db.Warehouses on c.WarehouseId equals w.Id
                    where (request.WarehouseId == null || c.WarehouseId == request.WarehouseId) && (request.From == null || c.CreatedAtUtc >= request.From) && (request.To == null || c.CreatedAtUtc < request.To)
                    select new { c.Id, ProductName = p.Name, Sku = p.SKU, WarehouseName = w.Name, c.PreviousQuantity, c.CountedQuantity, c.Reason, c.CreatedAtUtc };
        if (!string.IsNullOrWhiteSpace(request.Search)) { var search = request.Search.Trim().ToLower(); query = query.Where(x => x.ProductName.ToLower().Contains(search) || x.Sku.ToLower().Contains(search)); }
        var count = await query.CountAsync(ct); var rows = await query.OrderByDescending(x => x.CreatedAtUtc).ThenBy(x => x.Id).Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).Select(x => new CountReportRow(x.Id, x.ProductName, x.Sku, x.WarehouseName, x.PreviousQuantity, x.CountedQuantity, x.Reason, x.CreatedAtUtc)).ToListAsync(ct);
        return new(rows, count, request.Page, request.PageSize);
    }
}
