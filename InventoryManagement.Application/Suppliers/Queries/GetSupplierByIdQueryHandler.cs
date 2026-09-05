using InventoryManagement.Application.Common.Interfaces;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Queries;

public sealed class GetSupplierByIdQueryHandler(ISupplierRepository repository) : IRequestHandler<GetSupplierByIdQuery, SupplierDto>
{
    public async Task<SupplierDto> Handle(GetSupplierByIdQuery request, CancellationToken ct) =>
        await repository.GetByIdAsync(request.Id, ct) ?? throw new KeyNotFoundException("Supplier not found.");
}
