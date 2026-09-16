using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Application.Workspace.Queries.GetDashboard;
using InventoryManagement.Application.Workspace.Queries.GetActivity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/workspace")]
[Authorize(Policy = InventoryPolicies.Read)]
public sealed class WorkspaceController(ISender sender) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct) => Ok(await sender.Send(new GetDashboardQuery(), ct));
    [HttpGet("activity")]
    [Authorize(Policy = InventoryPolicies.Manage)]
    public async Task<IActionResult> Activity([FromQuery] int page = 1, CancellationToken ct = default) => Ok(await sender.Send(new GetActivityQuery(page), ct));
}
