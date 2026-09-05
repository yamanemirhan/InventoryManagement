using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.CreatePurchaseOrder;

public sealed record CreatePurchaseOrderCommand(Guid SupplierId, Guid WarehouseId, IReadOnlyList<PurchaseOrderItemInput> Items) : IRequest<Guid>;
