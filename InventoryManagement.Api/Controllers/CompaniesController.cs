using InventoryManagement.Application.Companies.Commands.CreateCompany;
using InventoryManagement.Application.Companies.Commands.RemoveCompanyMember;
using InventoryManagement.Application.Companies.Commands.SetCompanyMember;
using InventoryManagement.Application.Companies.Commands.SynchronizeCompanyUser;
using InventoryManagement.Application.Companies.Commands.UpdateCompany;
using InventoryManagement.Application.Companies.Queries;
using InventoryManagement.Application.Companies.Queries.GetCompanyAdminOverview;
using InventoryManagement.Application.Companies.Queries.GetCompanyMembers;
using InventoryManagement.Application.Companies.Queries.GetCompanySession;
using InventoryManagement.Api.Contracts.Companies;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public sealed class CompaniesController(ISender sender) : ControllerBase
{
    [HttpGet("session")]
    public async Task<ActionResult<CompanySessionDto>> Session(CancellationToken ct)
    {
        await sender.Send(new SynchronizeCompanyUserCommand(), ct);
        return Ok(await sender.Send(new GetCompanySessionQuery(), ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCompanyCommand command, CancellationToken ct)
    {
        var id = await sender.Send(command, ct);
        return Ok(new { id });
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<CompanyMemberDto>>> Members(Guid id, CancellationToken ct) =>
        Ok(await sender.Send(new GetCompanyMembersQuery(id), ct));

    [HttpPut("{id:guid}/members")]
    public async Task<IActionResult> SetMember(Guid id, SetCompanyMemberRequest request, CancellationToken ct)
    {
        await sender.Send(new SetCompanyMemberCommand(id, request.SubjectId, request.Role), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId, CancellationToken ct)
    {
        await sender.Send(new RemoveCompanyMemberCommand(id, memberId), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateCompanyRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateCompanyCommand(id, request.Name, request.IsActive), ct);
        return NoContent();
    }

    [HttpGet("admin")]
    public async Task<ActionResult<CompanyAdminOverviewDto>> Admin(CancellationToken ct) =>
        Ok(await sender.Send(new GetCompanyAdminOverviewQuery(), ct));
}
