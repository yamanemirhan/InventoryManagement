using System.Security.Claims;
using InventoryManagement.Application.Common.Interfaces;

namespace InventoryManagement.Api.Common.Authentication;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal Principal => accessor.HttpContext?.User ?? throw new InvalidOperationException("Authentication required.");
    public string SubjectId => Principal.FindFirstValue("sub") ?? throw new InvalidOperationException("Missing subject.");
    public string Name => Principal.FindFirstValue("name") ?? Principal.Identity?.Name ?? SubjectId;
    public string Email => Principal.FindFirstValue("email") ?? "";
    public bool IsPlatformAdmin => Principal.IsInRole("Admin");
}
