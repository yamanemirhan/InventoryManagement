using InventoryManagement.Api.Common.Exceptions;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public sealed class CompaniesController(AppDbContext db) : ControllerBase
{
    private string Subject => User.FindFirstValue("sub") ?? throw new InvalidOperationException("Missing subject.");
    private bool PlatformAdmin => User.IsInRole("Admin");

    [HttpGet("session")]
    public async Task<IActionResult> Session(CancellationToken ct)
    {
        var name = User.FindFirstValue("name") ?? User.Identity?.Name ?? Subject;
        var email = User.FindFirstValue("email") ?? "";
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO \"ApplicationUsers\" (\"SubjectId\", \"Name\", \"Email\") VALUES ({Subject}, {name}, {email}) ON CONFLICT (\"SubjectId\") DO UPDATE SET \"Name\" = EXCLUDED.\"Name\", \"Email\" = EXCLUDED.\"Email\"", ct);
        var companies = await (from c in db.Companies
            where c.IsActive && (PlatformAdmin || db.CompanyMembers.Any(m => m.CompanyId == c.Id && m.SubjectId == Subject))
            orderby c.Name, c.Id
            select new { c.Id, c.Name, Role = PlatformAdmin ? "Owner" : db.CompanyMembers.Where(m => m.CompanyId == c.Id && m.SubjectId == Subject).Select(m => m.Role).First() }).ToListAsync(ct);
        return Ok(new { subjectId = Subject, platformAdmin = PlatformAdmin, companies });
    }

    public sealed record CreateCompany([Required, StringLength(200, MinimumLength = 2)] string Name);
    [HttpPost]
    public async Task<IActionResult> Create(CreateCompany request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 2) return BadRequest();
        if (!await db.ApplicationUsers.AnyAsync(x => x.SubjectId == Subject, ct)) return Conflict(new ProblemDetails { Detail = ErrorMessages.Localize("Load your session first.") });
        var company = new Company { Name = request.Name.Trim() };
        db.Companies.Add(company);
        db.CompanyMembers.Add(new CompanyMember { CompanyId = company.Id, SubjectId = Subject, Role = "Owner" });
        await db.SaveChangesAsync(ct);
        return Ok(new { company.Id });
    }

    private async Task<bool> CanManage(Guid id, CancellationToken ct) =>
        PlatformAdmin || await db.CompanyMembers.AnyAsync(x => x.CompanyId == id && x.SubjectId == Subject && x.Role == "Owner", ct);

    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> Members(Guid id, CancellationToken ct)
    {
        if (!await CanManage(id, ct)) return Forbid();
        return Ok(await (from m in db.CompanyMembers join u in db.ApplicationUsers on m.SubjectId equals u.SubjectId
            where m.CompanyId == id orderby u.Name select new { m.Id, m.SubjectId, m.Role, u.Name, u.Email }).ToListAsync(ct));
    }

    public sealed record MemberInput([Required, StringLength(200)] string SubjectId, [Required] string Role);
    [HttpPut("{id:guid}/members")]
    public async Task<IActionResult> SetMember(Guid id, MemberInput input, CancellationToken ct)
    {
        if (!CompanyRoles.All.Contains(input.Role)) return BadRequest();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Serialize membership changes, including authorization, to preserve at least one owner.
        var company = await db.Companies.FromSqlInterpolated($"SELECT * FROM \"Companies\" WHERE \"Id\" = {id} FOR UPDATE").SingleOrDefaultAsync(ct);
        if (company is null) return NotFound();
        if (!await CanManage(id, ct)) return Forbid();
        if (!await db.ApplicationUsers.AnyAsync(x => x.SubjectId == input.SubjectId, ct))
            return BadRequest(new ProblemDetails { Detail = ErrorMessages.Localize("The user must sign in to the application first. Use their account ID.") });
        var member = await db.CompanyMembers.SingleOrDefaultAsync(x => x.CompanyId == id && x.SubjectId == input.SubjectId, ct);
        if (member?.Role == "Owner" && input.Role != "Owner" && !await db.CompanyMembers.AnyAsync(x => x.CompanyId == id && x.Role == "Owner" && x.SubjectId != input.SubjectId, ct))
            return Conflict(new ProblemDetails { Detail = ErrorMessages.Localize("A company must retain at least one owner.") });
        if (member is null) db.CompanyMembers.Add(new CompanyMember { CompanyId = id, SubjectId = input.SubjectId, Role = input.Role });
        else member.Role = input.Role;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Companies.FromSqlInterpolated($"SELECT * FROM \"Companies\" WHERE \"Id\" = {id} FOR UPDATE").ToListAsync(ct);
        if (!await CanManage(id, ct)) return Forbid();
        var member = await db.CompanyMembers.SingleOrDefaultAsync(x => x.CompanyId == id && x.Id == memberId, ct);
        if (member is null) return NotFound();
        if (member.Role == "Owner" && !await db.CompanyMembers.AnyAsync(x => x.CompanyId == id && x.Role == "Owner" && x.Id != memberId, ct))
            return Conflict(new ProblemDetails { Detail = ErrorMessages.Localize("A company must retain at least one owner.") });
        db.CompanyMembers.Remove(member);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }

    public sealed record CompanyInput([Required, StringLength(200, MinimumLength = 2)] string Name, bool IsActive);
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CompanyInput input, CancellationToken ct)
    {
        if (!PlatformAdmin) return Forbid();
        if (string.IsNullOrWhiteSpace(input.Name) || input.Name.Trim().Length < 2) return BadRequest();
        var company = await db.Companies.FindAsync([id], ct);
        if (company is null) return NotFound();
        company.Name = input.Name.Trim();
        company.IsActive = input.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("admin")]
    public async Task<IActionResult> Admin(CancellationToken ct)
    {
        if (!PlatformAdmin) return Forbid();
        return Ok(new {
            companies = await db.Companies.OrderBy(x => x.Name).Select(x => new { x.Id, x.Name, x.IsActive, x.CreatedAtUtc, MemberCount = db.CompanyMembers.Count(m => m.CompanyId == x.Id) }).ToListAsync(ct),
            users = await db.ApplicationUsers.OrderBy(x => x.Name).Select(x => new { x.SubjectId, x.Name, x.Email, CompanyCount = db.CompanyMembers.Count(m => m.SubjectId == x.SubjectId) }).ToListAsync(ct)
        });
    }
}

