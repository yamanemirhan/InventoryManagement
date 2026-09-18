using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InventoryOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CountRevision",
                table: "Stocks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinimumQuantity",
                table: "Stocks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "StockMovements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "StockMovements",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SignedDelta",
                table: "StockMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FulfillmentRevision",
                table: "PurchaseOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReceivedQuantity",
                table: "PurchaseOrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReturnedQuantity",
                table: "PurchaseOrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Existing fully received orders must not become receivable again.
            migrationBuilder.Sql("""
                UPDATE "PurchaseOrderItems" AS item
                SET "ReceivedQuantity" = item."Quantity"
                FROM "PurchaseOrders" AS purchase
                WHERE purchase."Id" = item."PurchaseOrderId"
                  AND purchase."CompanyId" = item."CompanyId"
                  AND purchase."Status" = 3;
                """);

            migrationBuilder.CreateTable(
                name: "CompanyInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AcceptedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailSentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextEmailAttemptAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EmailAttempts = table.Column<int>(type: "integer", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyInvitations_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockCounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousQuantity = table.Column<int>(type: "integer", nullable: false),
                    CountedQuantity = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ActorSubjectId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockCounts", x => x.Id);
                    table.UniqueConstraint("AK_StockCounts_CompanyId_Id", x => new { x.CompanyId, x.Id });
                    table.ForeignKey(
                        name: "FK_StockCounts_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockCounts_Products_CompanyId_ProductId",
                        columns: x => new { x.CompanyId, x.ProductId },
                        principalTable: "Products",
                        principalColumns: new[] { "CompanyId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockCounts_Warehouses_CompanyId_WarehouseId",
                        columns: x => new { x.CompanyId, x.WarehouseId },
                        principalTable: "Warehouses",
                        principalColumns: new[] { "CompanyId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_CompanyId_PurchaseOrderId",
                table: "StockMovements",
                columns: new[] { "CompanyId", "PurchaseOrderId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyInvitations_CompanyId_Email",
                table: "CompanyInvitations",
                columns: new[] { "CompanyId", "Email" },
                unique: true,
                filter: "\"AcceptedAtUtc\" IS NULL AND \"RevokedAtUtc\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_StockCounts_CompanyId_ProductId",
                table: "StockCounts",
                columns: new[] { "CompanyId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_StockCounts_CompanyId_WarehouseId",
                table: "StockCounts",
                columns: new[] { "CompanyId", "WarehouseId" });

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_PurchaseOrders_CompanyId_PurchaseOrderId",
                table: "StockMovements",
                columns: new[] { "CompanyId", "PurchaseOrderId" },
                principalTable: "PurchaseOrders",
                principalColumns: new[] { "CompanyId", "Id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_PurchaseOrders_CompanyId_PurchaseOrderId",
                table: "StockMovements");

            migrationBuilder.DropTable(
                name: "CompanyInvitations");

            migrationBuilder.DropTable(
                name: "StockCounts");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_CompanyId_PurchaseOrderId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "CountRevision",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "MinimumQuantity",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "SignedDelta",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "FulfillmentRevision",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "ReceivedQuantity",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "ReturnedQuantity",
                table: "PurchaseOrderItems");
        }
    }
}
