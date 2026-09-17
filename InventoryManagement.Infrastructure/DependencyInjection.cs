
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Infrastructure.Persistence;
using InventoryManagement.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection was not found.");

        // scoped lifetime is used for DbContext to ensure that a new instance is created for each request,
        // which is the recommended practice for web applications.
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IKnowledgeRepository, KnowledgeRepository>();
        services.AddScoped<IWorkspaceReadRepository, WorkspaceReadRepository>();
        services.AddScoped<IRealtimeEventStore, RealtimeEventStore>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<ICompanyReadRepository, CompanyReadRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IProductReadRepository, ProductReadRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IStockRepository, StockRepository>();
        services.AddScoped<IStockReadRepository, StockReadRepository>();
        services.AddScoped<IStockMovementRepository, StockMovementRepository>();
        services.AddScoped<IStockMovementReadRepository, StockMovementReadRepository>();
        services.AddScoped<IWarehouseReadRepository, WarehouseReadRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
        services.AddScoped<IPurchaseOrderReadRepository, PurchaseOrderReadRepository>();

        return services;
    }
}
