using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Commands.CreatePurchaseOrder;

public sealed record PurchaseOrderItemInput(Guid ProductId, int Quantity, decimal UnitPrice);
