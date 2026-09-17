using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RealtimeActivityDispatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAtUtc",
                table: "ActivityEntries",
                type: "timestamp with time zone",
                nullable: true);

            // Do not replay historical activity as new live notifications.
            migrationBuilder.Sql("UPDATE \"ActivityEntries\" SET \"PublishedAtUtc\" = CURRENT_TIMESTAMP;");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityEntries_CreatedAtUtc",
                table: "ActivityEntries",
                column: "CreatedAtUtc",
                filter: "\"PublishedAtUtc\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ActivityEntries_CreatedAtUtc",
                table: "ActivityEntries");

            migrationBuilder.DropColumn(
                name: "PublishedAtUtc",
                table: "ActivityEntries");
        }
    }
}
