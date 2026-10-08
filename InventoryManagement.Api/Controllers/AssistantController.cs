using InventoryManagement.Api.Common.Authentication;
using InventoryManagement.Application.Assistant;
using InventoryManagement.Application.Assistant.Commands.SendAssistantMessage;
using InventoryManagement.Application.Assistant.Queries.GetAssistantConfiguration;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/assistant")]
[Authorize(Policy = InventoryPolicies.Read)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AssistantController(ISender sender) : ControllerBase
{
    [HttpGet("configuration")]
    public async Task<ActionResult<AssistantConfiguration>> Configuration(CancellationToken ct) =>
        Ok(await sender.Send(new GetAssistantConfigurationQuery(), ct));
    [HttpPost("messages")]
    [EnableRateLimiting("assistant")]
    [RequestSizeLimit(65536)]
    public async Task<ActionResult<AssistantReply>> Send(SendAssistantMessageCommand command, CancellationToken ct) =>
        Ok(await sender.Send(command, ct));
}
