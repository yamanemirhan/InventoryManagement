using MediatR;
namespace InventoryManagement.Application.Suppliers.Commands.UpdateSupplier;

public sealed record UpdateSupplierCommand(Guid Id, string Name, string Email) : IRequest;
