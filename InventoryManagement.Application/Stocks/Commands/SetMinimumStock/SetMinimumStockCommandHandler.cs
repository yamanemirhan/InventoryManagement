using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using MediatR;
namespace InventoryManagement.Application.Stocks.Commands.SetMinimumStock;

public sealed class SetMinimumStockCommandHandler(IStockRepository stocks, ICatalogRepository catalog, IUnitOfWork unitOfWork) : IRequestHandler<SetMinimumStockCommand>
{
    public async Task Handle(SetMinimumStockCommand request, CancellationToken ct)
    {
        if (await catalog.GetProductAsync(request.ProductId, ct) is null || await catalog.GetWarehouseAsync(request.WarehouseId, ct) is null) throw new KeyNotFoundException("Product or warehouse not found.");
        var stock = await stocks.GetAsync(request.ProductId, request.WarehouseId, ct);
        if ((stock?.Version ?? 0) != request.ExpectedVersion) throw new ConcurrencyException("Stock changed. Reload before saving.");
        if (stock is null) { stock = new Stock(request.ProductId, request.WarehouseId); await stocks.AddAsync(stock, ct); }
        stock.SetMinimum(request.MinimumQuantity);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
