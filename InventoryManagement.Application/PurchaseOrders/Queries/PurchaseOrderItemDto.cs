using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed record PurchaseOrderItemDto(Guid ProductId, string ProductName, string Sku, int Quantity, decimal UnitPrice, decimal TotalPrice, int ReceivedQuantity = 0, int ReturnedQuantity = 0);
