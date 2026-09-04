
using InventoryManagement.Application.Warehouses.Commands.CreateWarehouse;
using InventoryManagement.Application.Warehouses.Queries.GetWarehouses;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/warehouses")]
public class WarehousesController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Guid>> Create(CreateWarehouseCommand command, CancellationToken cancellationToken)
    {
        var id = await sender.Send(command, cancellationToken);

        return Ok(id);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WarehouseDto>>> GetAll(
    CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetWarehousesQuery(),
            cancellationToken);

        return Ok(result);
    }
}