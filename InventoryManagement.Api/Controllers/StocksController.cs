
using InventoryManagement.Application.Stocks.Commands.IncreaseStock;
using InventoryManagement.Application.Stocks.Commands.TransferStock;
using InventoryManagement.Application.Stocks.Queries.GetWarehouseStock;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/stocks")]
public class StocksController(ISender sender) : ControllerBase
{
    [HttpPost("increase")]
    public async Task<IActionResult> Increase(IncreaseStockCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("transfer")]
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
}