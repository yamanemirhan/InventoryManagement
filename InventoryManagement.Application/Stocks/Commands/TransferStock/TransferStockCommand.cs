
using MediatR;

namespace InventoryManagement.Application.Stocks.Commands.TransferStock;

public sealed record TransferStockCommand(Guid ProductId, Guid SourceWarehouseId, Guid TargetWarehouseId, int Quantity) : IRequest;