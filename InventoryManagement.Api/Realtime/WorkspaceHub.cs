using System.Security.Claims;
using InventoryManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InventoryManagement.Api.Realtime;

[Authorize]
public sealed class WorkspaceHub(ICompanyReadRepository companies, WorkspaceConnections connections) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var http = Context.GetHttpContext()!;
        var principal = Context.User!;
        var subject = principal.FindFirstValue("sub");
        if (!Guid.TryParse(http.Request.Query["companyId"], out var companyId) || subject is null ||
            !long.TryParse(principal.FindFirstValue("exp"), out var expiration))
        {
            Context.Abort();
            return;
        }
        var access = await companies.GetAccessAsync(companyId, subject, Context.ConnectionAborted);
        var admin = principal.IsInRole("Admin");
        if (access?.IsActive != true || (access.Role is null && !admin))
        {
            Context.Abort();
            return;
        }
        connections.Add(new(Context.ConnectionId, companyId, subject, admin, DateTimeOffset.FromUnixTimeSeconds(expiration)));
        await base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        connections.Remove(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}
