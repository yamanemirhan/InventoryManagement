using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Reports.Queries;
using InventoryManagement.Application.Reports.Queries.GetStockReport;
using InventoryManagement.Application.Reports.Queries.GetMovementReport;
using InventoryManagement.Application.Reports.Queries.GetCountReport;
namespace InventoryManagement.Application.Common.Interfaces;

public interface IInventoryReportRepository
{
    Task<PagedResult<StockReportRow>> GetStockReportAsync(GetStockReportQuery query, CancellationToken ct);
    Task<PagedResult<MovementReportRow>> GetMovementReportAsync(GetMovementReportQuery query, CancellationToken ct);
    Task<PagedResult<CountReportRow>> GetCountReportAsync(GetCountReportQuery query, CancellationToken ct);
}
