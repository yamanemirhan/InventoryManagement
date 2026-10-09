using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace InventoryManagement.Infrastructure.Persistence.Configurations;
public sealed class ImportBatchConfiguration : IEntityTypeConfiguration<ImportBatch>
{
    public void Configure(EntityTypeBuilder<ImportBatch> builder)
    {
        builder.Property(x => x.Kind).HasMaxLength(30);
        builder.Property(x => x.Fingerprint).HasMaxLength(64);
        builder.Property(x => x.ActorSubjectId).HasMaxLength(200);
        builder.HasIndex(x => new { x.CompanyId, x.Fingerprint }).IsUnique();
    }
}
