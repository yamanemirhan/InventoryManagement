using InventoryManagement.Application.Companies.Commands.CreateInvitation;
using InventoryManagement.Application.Companies.Commands.AcceptInvitation;
using InventoryManagement.Application.Companies.Commands.RevokeInvitation;
using InventoryManagement.Application.Companies.Queries.GetInvitations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace InventoryManagement.Api.Controllers;

[ApiController, Authorize, Route("api/company-invitations")]
public sealed class CompanyInvitationsController(ISender sender) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get(CancellationToken ct, Guid? companyId = null) => Ok(await sender.Send(new GetInvitationsQuery(companyId), ct));
    [HttpPost] public async Task<IActionResult> Create(CreateInvitationCommand command, CancellationToken ct) => Ok(await sender.Send(command, ct));
    [HttpPost("{id:guid}/accept")] public async Task<IActionResult> Accept(Guid id, CancellationToken ct) { await sender.Send(new AcceptInvitationCommand(id), ct); return NoContent(); }
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Revoke(Guid id, CancellationToken ct) { await sender.Send(new RevokeInvitationCommand(id), ct); return NoContent(); }
}
