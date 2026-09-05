using InventoryManagement.Application.Suppliers.Commands.CreateSupplier;
using InventoryManagement.Application.Suppliers.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;
[ApiController]
[Route("api/suppliers")]
public sealed class SuppliersController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Guid>> Create(CreateSupplierCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SupplierDto>>> GetAll(CancellationToken ct) => Ok(await sender.Send(new GetSuppliersQuery(), ct));
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupplierDto>> GetById(Guid id, CancellationToken ct) => Ok(await sender.Send(new GetSupplierByIdQuery(id), ct));
}
