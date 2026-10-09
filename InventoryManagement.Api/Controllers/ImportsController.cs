using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Application.Imports.Commands.CommitImport;
using InventoryManagement.Application.Imports.Queries.PreviewImport;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController, Route("api/imports"), Authorize(Policy = InventoryPolicies.Manage)]
[RequestSizeLimit(1_048_576)]
public sealed class ImportsController(ISender sender) : ControllerBase
{
    [HttpPost("preview")]
    public async Task<IActionResult> Preview(PreviewImportQuery query, CancellationToken ct) => Ok(await sender.Send(query, ct));
    [HttpPost]
    public async Task<IActionResult> Import(CommitImportCommand command, CancellationToken ct) => Ok(await sender.Send(command, ct));
}
