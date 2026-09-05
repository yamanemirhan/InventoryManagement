using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed record PurchaseOrderListItemDto(Guid Id, Guid SupplierId, string SupplierName, Guid WarehouseId, string WarehouseName, PurchaseOrderStatus Status, DateTime CreatedAtUtc, int ItemCount, decimal TotalAmount);
