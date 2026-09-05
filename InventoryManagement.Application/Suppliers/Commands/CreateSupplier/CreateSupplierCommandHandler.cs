using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Commands.CreateSupplier;

public sealed class CreateSupplierCommandHandler(ISupplierRepository repository, IUnitOfWork unitOfWork) : IRequestHandler<CreateSupplierCommand, Guid>
{
    public async Task<Guid> Handle(CreateSupplierCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await repository.ExistsByEmailAsync(email, ct))
            throw new InvalidOperationException("A supplier with this email already exists.");
        var supplier = new Supplier(request.Name, email);
        await repository.AddAsync(supplier, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return supplier.Id;
    }
}
