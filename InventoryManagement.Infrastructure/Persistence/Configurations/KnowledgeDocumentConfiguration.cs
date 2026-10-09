using InventoryManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryManagement.Infrastructure.Persistence.Configurations;

public sealed class KnowledgeDocumentConfiguration : IEntityTypeConfiguration<KnowledgeDocument>
{
    public void Configure(EntityTypeBuilder<KnowledgeDocument> builder)
    {
        builder.Property(x => x.Title).HasMaxLength(200);
        builder.Property(x => x.Content).HasMaxLength(30000);
        builder.Property(x => x.Status).HasMaxLength(20);
        builder.Property(x => x.Revision).IsConcurrencyToken();
        builder.Property<NpgsqlTypes.NpgsqlTsVector>("SearchVector")
            .HasComputedColumnSql("to_tsvector('turkish', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", '')) || to_tsvector('english', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", '')) || to_tsvector('simple', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", ''))", stored: true);
        builder.HasIndex("SearchVector").HasMethod("GIN");
        builder.HasIndex(x => new { x.CompanyId, x.UpdatedAtUtc, x.Id });
    }
}
