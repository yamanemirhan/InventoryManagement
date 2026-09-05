using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.Lifecycle;

public sealed record CancelPurchaseOrderCommand(Guid Id) : IRequest;
