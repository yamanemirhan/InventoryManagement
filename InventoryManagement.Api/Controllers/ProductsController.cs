using InventoryManagement.Api.Common.Authentication;
using Microsoft.AspNetCore.Authorization;

using InventoryManagement.Application.Products.Commands.CreateProduct;
using InventoryManagement.Application.Products.Queries.GetProductById;
using InventoryManagement.Application.Products.Queries.GetProducts;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Authorize(Policy = InventoryPolicies.Read)]
[Route("api/products")]
public class ProductsController(ISender sender) : Controller
{
    [HttpGet("lookup")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Lookup([FromQuery] string code, CancellationToken ct)
    {
        var product = await sender.Send(new InventoryManagement.Application.Products.Queries.GetProductByCode.GetProductByCodeQuery(code), ct);
        return product is null ? NotFound() : Ok(product);
    }
    [HttpPut("{id:guid}/barcode")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Barcode(Guid id, InventoryManagement.Application.Products.Commands.SetProductBarcode.SetProductBarcodeCommand command, CancellationToken ct)
    { await sender.Send(command with { Id = id }, ct); return NoContent(); }
    [HttpPost("import/preview")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    [RequestSizeLimit(524288)]
    public async Task<IActionResult> Preview(InventoryManagement.Application.Products.Queries.PreviewProductImport.PreviewProductImportQuery query, CancellationToken ct) => Ok(await sender.Send(query, ct));
    [HttpPost("import")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    [RequestSizeLimit(524288)]
    public async Task<IActionResult> Import(InventoryManagement.Application.Products.Commands.ImportProducts.ImportProductsCommand command, CancellationToken ct) => Ok(await sender.Send(command, ct));
    [HttpPost]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<ActionResult<Guid>> Create(CreateProductCommand command, CancellationToken cancellationToken)
    {
        var id = await sender.Send(command, cancellationToken);

        return Ok(id);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await sender.Send(new GetProductByIdQuery(id), cancellationToken);

        if (product is null)
            return NotFound();

        return Ok(product);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await sender.Send(new GetProductsQuery(), cancellationToken);

        return Ok(products);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Update(Guid id, InventoryManagement.Application.Products.Commands.UpdateProduct.UpdateProductCommand command, CancellationToken ct)
    {
        await sender.Send(command with { Id = id }, ct);
        return NoContent();
    }
}
