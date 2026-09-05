using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Queries;

public sealed record SupplierDto(Guid Id, string Name, string Email);
