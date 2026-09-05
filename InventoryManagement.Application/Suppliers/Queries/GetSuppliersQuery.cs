using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Queries;

public sealed record GetSuppliersQuery : IRequest<IReadOnlyList<SupplierDto>>;
