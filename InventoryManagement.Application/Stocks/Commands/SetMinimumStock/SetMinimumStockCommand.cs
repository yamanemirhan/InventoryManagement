using MediatR;
namespace InventoryManagement.Application.Stocks.Commands.SetMinimumStock;

public sealed record SetMinimumStockCommand(Guid ProductId, Guid WarehouseId, int MinimumQuantity, uint ExpectedVersion) : IRequest;
