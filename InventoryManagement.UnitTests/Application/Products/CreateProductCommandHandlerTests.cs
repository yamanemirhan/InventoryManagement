
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Application.Products.Commands.CreateProduct;
using InventoryManagement.Domain.Entities;
using NSubstitute;

namespace InventoryManagement.UnitTests.Application.Products;

public class CreateProductCommandHandlerTests
{
    [Fact]
    public async Task Handle_WhenSkuDoesNotExist_ShouldCreateProduct()
    {
        var repository = Substitute.For<IProductRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        // always return false for ExistsBySkuAsync to simulate that the SKU does not exist
        repository.ExistsBySkuAsync("KB-001", Arg.Any<CancellationToken>()).Returns(false);

        var handler = new CreateProductCommandHandler(repository, unitOfWork);

        var command = new CreateProductCommand("Mechanical Keyboard", "KB-001");

        var id = await handler.Handle(command, CancellationToken.None);

        // verify that the returned id is not empty
        Assert.NotEqual(Guid.Empty, id);

        // verify that the repository's AddAsync method was called with a product that has the correct name and SKU
        await repository.Received(1).AddAsync(Arg.Is<Product>(x => x.Name == "Mechanical Keyboard" && x.SKU == "KB-001"), Arg.Any<CancellationToken>());

        // verify that the unit of work's SaveChangesAsync method was called
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenSkuExists_ShouldThrowAndNotSave()
    {
        var repository = Substitute.For<IProductRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();

        repository.ExistsBySkuAsync("KB-001", Arg.Any<CancellationToken>()).Returns(true);

        var handler = new CreateProductCommandHandler(repository, unitOfWork);

        var command = new CreateProductCommand("Mechanical Keyboard", "KB-001");

        // verify that an InvalidOperationException is thrown when the SKU already exists
        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));

        // verify that the repository's AddAsync method was not called
        await repository.DidNotReceive().AddAsync(Arg.Any<Product>(), Arg.Any<CancellationToken>());

        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
