using MediatR;
namespace InventoryManagement.Application.Products.Commands.SetProductBarcode;
public sealed record SetProductBarcodeCommand(Guid Id, string? Barcode) : IRequest;
