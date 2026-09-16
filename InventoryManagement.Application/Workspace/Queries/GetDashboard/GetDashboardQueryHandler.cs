using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Queries.GetDashboard;

public sealed class GetDashboardQueryHandler(IWorkspaceReadRepository repository) : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken ct) { return await repository.GetDashboardAsync(ct); }
}
