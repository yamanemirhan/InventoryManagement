
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Warehouses.Commands.CreateWarehouse;
using InventoryManagement.Domain.Entities;
using NSubstitute;

namespace InventoryManagement.UnitTests.Application.Warehouses;

public class CreateWarehouseCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldCreateWarehouseAndSave()
    {
        var repository = Substitute.For<IWarehouseRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        var handler = new CreateWarehouseCommandHandler(repository, unitOfWork);

        var command = new CreateWarehouseCommand("Main Warehouse", "Istanbul");

        var id = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);

        await repository.Received(1).AddAsync(
                Arg.Is<Warehouse>(x =>
                    x.Name == "Main Warehouse" &&
                    x.Location == "Istanbul"),
                Arg.Any<CancellationToken>());

        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}