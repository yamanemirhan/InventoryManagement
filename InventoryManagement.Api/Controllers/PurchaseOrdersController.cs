using InventoryManagement.Api.Common.Authentication;
using Microsoft.AspNetCore.Authorization;
using InventoryManagement.Application.PurchaseOrders.Commands.CreatePurchaseOrder;
using InventoryManagement.Application.PurchaseOrders.Commands.Lifecycle;
using InventoryManagement.Application.PurchaseOrders.Queries;
using InventoryManagement.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;

[ApiController]
[Authorize(Policy = InventoryPolicies.Read)]
[Route("api/purchase-orders")]
public sealed class PurchaseOrdersController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<ActionResult<Guid>> Create(CreatePurchaseOrderCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }
    [HttpGet]
    public async Task<ActionResult<PagedResult<PurchaseOrderListItemDto>>> GetAll(CancellationToken ct, int page = 1, int pageSize = 20) =>
        Ok(await sender.Send(new GetPurchaseOrdersQuery(page, pageSize), ct));
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PurchaseOrderDto>> GetById(Guid id, CancellationToken ct) => Ok(await sender.Send(new GetPurchaseOrderByIdQuery(id), ct));
    [HttpPost("{id:guid}/fulfillment")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Fulfill(Guid id, InventoryManagement.Application.PurchaseOrders.Commands.RecordPurchaseFulfillment.RecordPurchaseFulfillmentCommand command, CancellationToken ct)
    { await sender.Send(command with { Id = id }, ct); return NoContent(); }
    [HttpPost("{id:guid}/order")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Order(Guid id, CancellationToken ct) { await sender.Send(new MarkPurchaseOrderAsOrderedCommand(id), ct); return NoContent(); }
    [HttpPost("{id:guid}/receive")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Receive(Guid id, CancellationToken ct) { await sender.Send(new ReceivePurchaseOrderCommand(id), ct); return NoContent(); }
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) { await sender.Send(new CancelPurchaseOrderCommand(id), ct); return NoContent(); }
}
