
using InventoryManagement.Domain.Entities;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using InventoryManagement.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.IntegrationTests.Infrastructure;

public class ProductRepositoryTests(PostgresFixture fixture) : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _fixture = fixture;

    [Fact]
    public async Task ExistsBySkuAsync_WhenProductExists_ShouldReturnTrue()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_fixture.ConnectionString)
            .Options;

        await using var dbContext = new AppDbContext(options);

        var repository = new ProductRepository(dbContext);

        var product = new Product("Mechanical Keyboard", "KB-TEST-001");

        await repository.AddAsync(product);
        await dbContext.SaveChangesAsync();

        var exists = await repository.ExistsBySkuAsync("KB-TEST-001");

        Assert.True(exists);
    }

    [Fact]
    public async Task GetByIdAsync_WhenProductIsSoftDeleted_ShouldReturnNull()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_fixture.ConnectionString)
            .Options;

        await using var dbContext = new AppDbContext(options);

        var repository = new ProductRepository(dbContext);

        var product = new Product("Gaming Mouse", "MOUSE-TEST-001");

        await repository.AddAsync(product);
        await dbContext.SaveChangesAsync();

        product.SoftDelete();
        await dbContext.SaveChangesAsync();

        var result = await repository.GetByIdAsync(product.Id);

        Assert.Null(result);
    }
}