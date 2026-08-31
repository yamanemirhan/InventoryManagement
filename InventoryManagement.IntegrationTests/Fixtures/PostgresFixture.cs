
using InventoryManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace InventoryManagement.IntegrationTests.Fixtures;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("inventory_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    // before each test, we will start the container and apply migrations to ensure a clean state
    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        // Apply migrations to the database
        var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(ConnectionString).Options;

        await using var dbContext = new AppDbContext(options);

        await dbContext.Database.MigrateAsync();
    }

    // after each test, we will stop the container to clean up resources
    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}