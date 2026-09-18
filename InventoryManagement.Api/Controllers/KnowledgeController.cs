using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocuments;
using InventoryManagement.Application.Workspace.Queries.GetKnowledgeDocument;
using InventoryManagement.Application.Workspace.Commands.CreateKnowledgeDocument;
using InventoryManagement.Application.Workspace.Commands.UpdateKnowledgeDocument;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/knowledge")]
[Authorize(Policy = InventoryPolicies.Read)]
public sealed class KnowledgeController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] string search = "", CancellationToken ct = default) => Ok(await sender.Send(new GetKnowledgeDocumentsQuery(page, search), ct));
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await sender.Send(new GetKnowledgeDocumentQuery(id), ct));
    [HttpPost]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Create(CreateKnowledgeDocumentCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }
    [HttpPut("{id:guid}")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Update(Guid id, UpdateKnowledgeDocumentCommand command, CancellationToken ct)
    {
        await sender.Send(command with { Id = id }, ct);
        return NoContent();
    }
}
