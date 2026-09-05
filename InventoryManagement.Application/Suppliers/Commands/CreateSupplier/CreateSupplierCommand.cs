using FluentValidation;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using MediatR;
namespace InventoryManagement.Application.Suppliers.Commands.CreateSupplier;

public sealed record CreateSupplierCommand(string Name, string Email) : IRequest<Guid>;
