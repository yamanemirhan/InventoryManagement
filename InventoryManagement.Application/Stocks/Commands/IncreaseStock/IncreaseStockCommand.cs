
using MediatR;

namespace InventoryManagement.Application.Stocks.Commands.IncreaseStock;

public sealed record IncreaseStockCommand(Guid ProductId, Guid WarehouseId, int Quantity) : IRequest;