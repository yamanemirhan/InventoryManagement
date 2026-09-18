using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Models;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.PurchaseOrders.Queries;

public sealed record PurchaseOrderDto(Guid Id, Guid SupplierId, string SupplierName, Guid WarehouseId, string WarehouseName, PurchaseOrderStatus Status, DateTime CreatedAtUtc, decimal TotalAmount, IReadOnlyList<PurchaseOrderItemDto> Items, uint Version = 0);
