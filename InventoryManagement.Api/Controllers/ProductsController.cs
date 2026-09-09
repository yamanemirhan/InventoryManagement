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
}
