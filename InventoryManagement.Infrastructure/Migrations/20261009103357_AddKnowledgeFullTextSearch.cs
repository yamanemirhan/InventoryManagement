using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace InventoryManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddKnowledgeFullTextSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "SearchVector",
                table: "KnowledgeDocuments",
                type: "tsvector",
                nullable: true,
                computedColumnSql: "to_tsvector('turkish', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", '')) || to_tsvector('english', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", '')) || to_tsvector('simple', coalesce(\"Title\", '') || ' ' || coalesce(\"Content\", ''))",
                stored: true);

            migrationBuilder.CreateIndex(
                name: "IX_KnowledgeDocuments_SearchVector",
                table: "KnowledgeDocuments",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_KnowledgeDocuments_SearchVector",
                table: "KnowledgeDocuments");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                table: "KnowledgeDocuments");
        }
    }
}
