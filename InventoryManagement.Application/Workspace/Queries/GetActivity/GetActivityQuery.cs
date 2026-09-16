using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Workspace.Queries.GetActivity;

public sealed record GetActivityQuery(int Page = 1) : IRequest<PagedResult<ActivityDto>>;
