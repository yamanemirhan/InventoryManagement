using MediatR;
namespace InventoryManagement.Application.Stocks.Commands.CountStock;

public sealed record CountStockCommand(Guid ProductId, Guid WarehouseId, int Quantity, string Reason, uint ExpectedVersion) : IRequest;
