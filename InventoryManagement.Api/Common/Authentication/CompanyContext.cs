using System.Security.Claims;
using InventoryManagement.Application.Common.Interfaces;



namespace InventoryManagement.Api.Common.Authentication;

public sealed class CompanyContext : ICompanyContext
{
    public Guid CompanyId { get; set; }
}

public sealed class CompanyContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext http, ICompanyReadRepository repository, CompanyContext company)
    {
        var policies = http.GetEndpoint()?.Metadata.GetOrderedMetadata<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>();
        var inventory = policies?.Any(x => x.Policy is InventoryPolicies.Read or InventoryPolicies.Manage or InventoryPolicies.Transfer) == true;
        if (inventory && http.User.Identity?.IsAuthenticated == true)
        {
            if (!Guid.TryParse(http.Request.Headers["X-Company-Id"], out var id))
            {
                await Results.Problem(statusCode: 400, detail: "Select a company first.").ExecuteAsync(http);
                return;
            }
            var subject = http.User.FindFirstValue("sub")!;
            var access = await repository.GetAccessAsync(id, subject, http.RequestAborted);
            var active = access?.IsActive == true;
            var role = access?.Role;
            if (!active || (role is null && !http.User.IsInRole("Admin")))
            {
                await Results.Problem(statusCode: 403, detail: "Company access denied.").ExecuteAsync(http);
                return;
            }
            var identity = (ClaimsIdentity)http.User.Identity!;
            foreach (var claim in identity.FindAll("company_role").ToList()) identity.RemoveClaim(claim);
            company.CompanyId = id;
            ((ClaimsIdentity)http.User.Identity!).AddClaim(new Claim("company_role", http.User.IsInRole("Admin") ? "Owner" : role!));
        }
        await next(http);
    }
}

