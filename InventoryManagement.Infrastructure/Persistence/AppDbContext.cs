
using InventoryManagement.Application.Common.Exceptions;
using InventoryManagement.Application.Common.Interfaces;
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using InventoryManagement.Domain.Common;


namespace InventoryManagement.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, ICompanyContext? companyContext = null, ICurrentUser? currentUser = null) : DbContext(options), IUnitOfWork
{
    public Guid CurrentCompanyId => companyContext?.CompanyId ?? Guid.Empty;
    public DbSet<KnowledgeDocument> KnowledgeDocuments => Set<KnowledgeDocument>();
    public DbSet<ImportBatch> ImportBatches => Set<ImportBatch>();
    public DbSet<ActivityEntry> ActivityEntries => Set<ActivityEntry>();
    public DbSet<CompanyInvitation> CompanyInvitations => Set<CompanyInvitation>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyMember> CompanyMembers => Set<CompanyMember>();
    public DbSet<ApplicationUser> ApplicationUsers => Set<ApplicationUser>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockCount> StockCounts => Set<StockCount>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.Entity<Company>().Property(x => x.Name).HasMaxLength(200);
        modelBuilder.Entity<CompanyInvitation>().Property(x => x.Email).HasMaxLength(320);
        modelBuilder.Entity<CompanyInvitation>().Property(x => x.Role).HasMaxLength(20);
        modelBuilder.Entity<CompanyInvitation>().Property(x => x.Version).IsRowVersion();
        modelBuilder.Entity<CompanyInvitation>().HasOne<Company>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<CompanyInvitation>().HasIndex(x => new { x.CompanyId, x.Email }).IsUnique().HasFilter("\"AcceptedAtUtc\" IS NULL AND \"RevokedAtUtc\" IS NULL");
        modelBuilder.Entity<ApplicationUser>().HasKey(x => x.SubjectId);
        modelBuilder.Entity<ApplicationUser>().Property(x => x.SubjectId).HasMaxLength(200);
        modelBuilder.Entity<ApplicationUser>().Property(x => x.Name).HasMaxLength(300);
        modelBuilder.Entity<ApplicationUser>().Property(x => x.Email).HasMaxLength(320);
        modelBuilder.Entity<CompanyMember>().Property(x => x.SubjectId).HasMaxLength(200);
        modelBuilder.Entity<CompanyMember>().Property(x => x.Role).HasMaxLength(20);
        modelBuilder.Entity<CompanyMember>().HasIndex(x => new { x.CompanyId, x.SubjectId }).IsUnique();
        modelBuilder.Entity<CompanyMember>().HasOne<Company>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<CompanyMember>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.SubjectId).OnDelete(DeleteBehavior.Restrict);
        ConfigureCompany<KnowledgeDocument>(modelBuilder);
        ConfigureCompany<ImportBatch>(modelBuilder);
        modelBuilder.Entity<ActivityEntry>().HasQueryFilter(x => x.CompanyId == CurrentCompanyId);
        ConfigureCompany<Product>(modelBuilder);
        ConfigureCompany<Warehouse>(modelBuilder);
        ConfigureCompany<Supplier>(modelBuilder);
        ConfigureCompany<Stock>(modelBuilder);
        ConfigureCompany<StockCount>(modelBuilder);
        modelBuilder.Entity<StockCount>().Property(x => x.Reason).HasMaxLength(500);
        modelBuilder.Entity<StockCount>().Property(x => x.ActorSubjectId).HasMaxLength(200);
        modelBuilder.Entity<StockCount>().HasOne<Product>().WithMany().HasForeignKey(x => new { x.CompanyId, x.ProductId }).HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<StockCount>().HasOne<Warehouse>().WithMany().HasForeignKey(x => new { x.CompanyId, x.WarehouseId }).HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<StockMovement>().Property(x => x.Reason).HasMaxLength(500);
        modelBuilder.Entity<StockMovement>().HasOne<PurchaseOrder>().WithMany().HasForeignKey(x => new { x.CompanyId, x.PurchaseOrderId }).HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.Restrict);
        ConfigureCompany<StockMovement>(modelBuilder);
        ConfigureCompany<PurchaseOrder>(modelBuilder);
        ConfigureCompany<PurchaseOrderItem>(modelBuilder);
    }

    private void ConfigureCompany<T>(ModelBuilder modelBuilder) where T : CompanyEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(x => x.CompanyId == CurrentCompanyId);
        modelBuilder.Entity<T>().HasAlternateKey(x => new { x.CompanyId, x.Id });
        modelBuilder.Entity<T>().HasOne<Company>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<CompanyEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            if (CurrentCompanyId == Guid.Empty) throw new InvalidOperationException("Select a company first.");
            if (entry.State == EntityState.Added) entry.Property(x => x.CompanyId).CurrentValue = CurrentCompanyId;
            else if (entry.Entity.CompanyId != CurrentCompanyId || entry.Property(x => x.CompanyId).IsModified)
                throw new InvalidOperationException("Company ownership cannot be changed.");
        }
        // Audit metadata is committed atomically with the business change. No field
        // values, document bodies, passwords or tokens are copied into the log.
        foreach (var pending in ChangeTracker.Entries<ActivityEntry>().Where(x => x.State == EntityState.Added).ToList())
            pending.State = EntityState.Detached;
        var changes = ChangeTracker.Entries().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToList();
        foreach (var entry in changes)
        {
            var companyId = entry.Entity switch
            {
                CompanyEntity entity => entity.CompanyId,
                Company entity => entity.Id,
                CompanyMember member => member.CompanyId,
                CompanyInvitation invitation => invitation.CompanyId,
                _ => Guid.Empty
            };
            if (companyId == Guid.Empty || entry.Entity is not Entity entityWithId) continue;
            ActivityEntries.Add(new ActivityEntry
            {
                CompanyId = companyId,
                EntityType = entry.Metadata.ClrType.Name,
                EntityId = entityWithId.Id,
                Action = entry.State.ToString(),
                ActorSubjectId = currentUser?.SubjectId
            });
        }
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        // Catch concurrency exceptions and throw a custom exception
        catch (DbUpdateConcurrencyException ex)
        {
            throw new ConcurrencyException("The data was modified by another request.", ex);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgres)
        {
            if (postgres.ConstraintName == "IX_Stocks_ProductId_WarehouseId")
                throw new ConcurrencyException("Stock was created by another request. Refresh and try again.", ex);
            if (postgres.ConstraintName == "IX_Products_CompanyId_Barcode")
                throw new InvalidOperationException("Barcode or SKU already belongs to another product.", ex);
            throw new InvalidOperationException("A record with the same SKU or email already exists.", ex);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        {
            throw new InvalidOperationException("A referenced record no longer exists. Refresh and try again.", ex);
        }
    }

    public void ClearChanges()
    {
        ChangeTracker.Clear();
    }
}
