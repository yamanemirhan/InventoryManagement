using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryManagement.Infrastructure.Persistence.Configurations;

public sealed class ActivityEntryConfiguration : IEntityTypeConfiguration<ActivityEntry>
{
    public void Configure(EntityTypeBuilder<ActivityEntry> builder)
    {
        builder.Property(x => x.EntityType).HasMaxLength(100);
        builder.Property(x => x.Action).HasMaxLength(20);
        builder.Property(x => x.ActorSubjectId).HasMaxLength(200);
        builder.HasIndex(x => new { x.CompanyId, x.CreatedAtUtc, x.Id });
        builder.HasIndex(x => x.CreatedAtUtc).HasFilter("\"PublishedAtUtc\" IS NULL");
        builder.HasOne<Company>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
    }
}
