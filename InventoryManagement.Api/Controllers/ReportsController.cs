using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Application.Reports.Queries.GetStockReport;
using InventoryManagement.Application.Reports.Queries.GetMovementReport;
using InventoryManagement.Application.Reports.Queries.GetCountReport;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;

[ApiController, Authorize(Policy = InventoryPolicies.Read), Route("api/reports")]
public sealed class ReportsController(ISender sender) : ControllerBase
{
    [HttpGet("stocks")] public async Task<IActionResult> Stocks([FromQuery] GetStockReportQuery query, CancellationToken ct) => Ok(await sender.Send(query, ct));
    [HttpGet("movements")] public async Task<IActionResult> Movements([FromQuery] GetMovementReportQuery query, CancellationToken ct) => Ok(await sender.Send(query, ct));
    [HttpGet("counts")] public async Task<IActionResult> Counts([FromQuery] GetCountReportQuery query, CancellationToken ct) => Ok(await sender.Send(query, ct));
}
