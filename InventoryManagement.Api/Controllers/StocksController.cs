using InventoryManagement.Application.Stocks.Queries.GetStockOverview;
using InventoryManagement.Api.Common.Authentication;
using Microsoft.AspNetCore.Authorization;

using InventoryManagement.Application.Stocks.Commands.IncreaseStock;
using InventoryManagement.Application.Stocks.Commands.TransferStock;
using InventoryManagement.Application.Stocks.Queries.GetStockMovementHistory;
using InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Authorize(Policy = InventoryPolicies.Read)]
[Route("api/stocks")]
public class StocksController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOverview(CancellationToken ct) =>
        Ok(await sender.Send(new GetStockOverviewQuery(), ct));

    [HttpGet("warehouse/{warehouseId:guid}/history/page")]
    public async Task<IActionResult> GetHistoryPage(Guid warehouseId, CancellationToken ct, int page = 1, int pageSize = 20) =>
        Ok(await sender.Send(new GetStockMovementHistoryPageQuery(warehouseId, page, pageSize), ct));

    [HttpPost("increase")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Increase(IncreaseStockCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("transfer")]
    [Authorize(Policy = InventoryPolicies.Transfer)]
    public async Task<IActionResult> Transfer(TransferStockCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpGet("warehouse/{warehouseId:guid}")]
    public async Task<ActionResult<IReadOnlyList<WarehouseStockItemDto>>> GetWarehouseStock(Guid warehouseId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetWarehouseStockQuery(warehouseId), cancellationToken);

        return Ok(result);
    }

    [HttpGet("warehouse/{warehouseId:guid}/history")]
    public async Task<ActionResult<IReadOnlyList<StockMovementDto>>> GetHistory(Guid warehouseId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetStockMovementHistoryQuery(warehouseId),
            cancellationToken);

        return Ok(result);
    }
}
