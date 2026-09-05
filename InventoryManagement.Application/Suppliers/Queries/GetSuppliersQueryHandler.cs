using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Queries;

public sealed class GetSuppliersQueryHandler(ISupplierRepository repository) : IRequestHandler<GetSuppliersQuery, IReadOnlyList<SupplierDto>>
{
    public Task<IReadOnlyList<SupplierDto>> Handle(GetSuppliersQuery request, CancellationToken ct) => repository.GetAllAsync(ct);
}
