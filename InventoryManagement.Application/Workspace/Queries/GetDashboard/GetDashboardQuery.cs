using MediatR;
using InventoryManagement.Application.Common.Models;
namespace InventoryManagement.Application.Workspace.Queries.GetDashboard;

public sealed record GetDashboardQuery() : IRequest<DashboardDto>;
