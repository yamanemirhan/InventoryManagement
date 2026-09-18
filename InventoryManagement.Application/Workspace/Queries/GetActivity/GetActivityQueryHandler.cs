using MediatR;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Application.Common.Interfaces;
namespace InventoryManagement.Application.Workspace.Queries.GetActivity;

public sealed class GetActivityQueryHandler(IWorkspaceReadRepository repository) : IRequestHandler<GetActivityQuery, PagedResult<ActivityDto>>
{
    public async Task<PagedResult<ActivityDto>> Handle(GetActivityQuery request, CancellationToken ct) { return await repository.GetActivityAsync(request.Page, ct); }
}
