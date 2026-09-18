
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace InventoryManagement.IntegrationTests.Fixtures;

public sealed class PostgresFixture : IAsyncLifetime, ICompanyContext
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("inventory_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Guid CompanyId { get; private set; }

    public string ConnectionString => _container.GetConnectionString();

    // Each test class gets its own database and company shared by its contexts.
    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        // Apply migrations to the database
        var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(ConnectionString).Options;

        await using var dbContext = new AppDbContext(options);

        await dbContext.Database.MigrateAsync();

        var company = new Company { Name = "Integration test company" };
        dbContext.Companies.Add(company);
        await dbContext.SaveChangesAsync();
        CompanyId = company.Id;
    }

    // Stop and remove the class database when its tests finish.
    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}
