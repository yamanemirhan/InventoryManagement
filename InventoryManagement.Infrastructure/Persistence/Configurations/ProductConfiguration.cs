
using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryManagement.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
          .HasMaxLength(200)
          .IsRequired();

        builder.Property(x => x.SKU)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(x => new { x.CompanyId, x.SKU })
            .IsUnique();

        builder.Property(x => x.IsDeleted)
            .IsRequired();
    }
}
