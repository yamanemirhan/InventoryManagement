# Milestones 1–12 implementation

Completed on 2026-09-05. Scope stops at milestone 12. Existing solution, frontend directory, CI/CD, deployment environments, and existing tests are preserved.

## Completion inventory

| Milestone | Completed behavior | Main added/changed files |
| --- | --- | --- |
| 1 | Analyzed entities, EF mappings, handlers, controllers, DI, and existing web scaffold. Baseline build passed. Missing records map to 404; unexpected exception details are not exposed. | `InventoryManagement.Api/Common/Exceptions/GlobalExceptionHandler.cs` |
| 2 | Supplier create/list/detail, normalized email, duplicate protection, validation, controller and DI. | `Application/Suppliers/**`, `Application/Common/Interfaces/ISupplierRepository.cs`, `Infrastructure/Persistence/Repositories/SupplierRepository.cs`, `Api/Controllers/SuppliersController.cs`, `Domain/Entities/Supplier.cs` |
| 3 | Purchase draft creation with supplier, warehouse, validated distinct products, quantities/prices, and projected list/detail contracts. | `Application/PurchaseOrders/Commands/CreatePurchaseOrder/**`, `Application/PurchaseOrders/Queries/**`, `Application/Common/Interfaces/IPurchaseOrder*.cs`, `Infrastructure/Persistence/Repositories/PurchaseOrder*.cs`, `Api/Controllers/PurchaseOrdersController.cs` |
| 4 | Draft → Ordered → Received and Draft/Ordered → Cancelled. Invalid transitions rejected by the domain. | `Application/PurchaseOrders/Commands/Lifecycle/**`, `Domain/Entities/PurchaseOrder.cs` |
| 5 | Receive updates all stock rows, stock movements and order state in one SaveChanges transaction. Order and stock concurrency protected; duplicate receipts and integer stock overflow rejected. | `ReceivePurchaseOrderCommandHandler.cs`, `Domain/Entities/Stock.cs`, `Infrastructure/Persistence/AppDbContext.cs`, `PurchaseOrderConfiguration.cs`, new concurrency migration |
| 6 | Warehouse details, product DTO projections, stable purchase-order pagination and paginated stock history. Transfer history is visible at both warehouses. Reads use AsNoTracking and projections. | `Application/Warehouses/Queries/GetWarehouseById/**`, `Application/Common/Models/PagedResult.cs`, `Application/Stocks/Queries/GetStockMovementHistory/**`, read repositories and existing controllers |
| 7 | Extended existing Next.js scaffold with semantic themes, centralized English copy, responsive navigation, reusable skeleton/error/empty states, typed API handling and global UI state. | `InventoryManagement.Web/src/app/{layout,globals,providers}.*`, `src/components/**`, `src/lib/**`, `src/store/**`, `package.json` |
| 8 | Product list/search/detail/create, Zod validation, server field errors and query invalidation. | `Web/src/features/products/**`, `Web/src/app/products/**` |
| 9 | Warehouse list/search/create/detail, cross-screen warehouse selection and stock/history navigation. | `Web/src/features/warehouses/**`, `Web/src/app/warehouses/**` |
| 10 | Select-based stock receipt and transfer forms, warehouse stock, inbound/outbound movement badges, history pagination and concurrency feedback. | `Web/src/features/stocks/**`, `Web/src/app/stocks/**`, `Web/src/app/warehouses/[id]/{stock,history}/page.tsx` |
| 11 | Supplier list/search/detail/create, email validation, typed API queries and standard states. | `Web/src/features/suppliers/**`, `Web/src/app/suppliers/**` |
| 12 | Purchase order list/detail/create, dynamic item rows and totals, status badges, confirmations, lifecycle-dependent actions and related cache invalidation. | `Web/src/features/purchase-orders/**`, `Web/src/app/purchase-orders/**`, `Web/src/components/ui/confirm-dialog.tsx` |

Abbreviated backend paths in the table use the corresponding `InventoryManagement.` project prefix. Shared DI changes are in `InventoryManagement.Infrastructure/DependencyInjection.cs`. The existing frontend project remains `InventoryManagement.Web` to preserve its deployment paths.

## Stable HTTP contracts

Existing routes are preserved. New routes:

- `POST /api/suppliers` → 201, JSON GUID and Location header.
- `GET /api/suppliers` → supplier array; `GET /api/suppliers/{id}` → detail.
- `GET /api/warehouses/{id}` → warehouse detail.
- `POST /api/purchase-orders` → 201, JSON GUID and Location header.
- `GET /api/purchase-orders?page=1&pageSize=20` → `{ items, totalCount, page, pageSize }`.
- `GET /api/purchase-orders/{id}` → supplier/warehouse names, status, item details, totals.
- `POST /api/purchase-orders/{id}/order|receive|cancel` → 204.
- `GET /api/stocks/warehouse/{id}/history/page?page=1&pageSize=20` → paginated movement DTOs.

Pagination validates page >= 1 and page size 1–100. Legacy history still returns an array. Master-data lookup lists retain their existing array shape. Purchase status numeric values: Draft=1, Ordered=2, Received=3, Cancelled=4. Movement values: In=1, Out=2, Transfer=3, Adjustment=4.

Read DTOs serialize `sku`; the existing domain property remains `SKU`. Stock quantities are integers. Unit prices are decimal with at most two fractional digits. Currency remains unspecified by the domain; the UI does not assume a currency.

## Migration

Added `InventoryManagement.Infrastructure/Migrations/20260904234729_PurchaseOrderConcurrency.cs`, its designer, and the updated model snapshot.

The migration maps purchase order Version to PostgreSQL's existing system `xmin` column via IsRowVersion. Npgsql emits no ordinary user column for xmin. Existing migrations are unchanged.

Apply to the intended development database:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api
```

The migration was applied successfully to an isolated local PostgreSQL database. EF reports no pending model changes. Staging and production databases were not modified. The machine's pre-existing EF CLI is 9.0.0 and reports a version warning against EF Core 10.0.11; generation/application/model checks succeeded.

## Verification

- Backend solution build: PASS, zero warnings/errors.
- Frontend ESLint: PASS.
- Frontend strict TypeScript / route type generation: PASS.
- Frontend optimized Next.js build: PASS, all 19 application routes generated.
- Existing unit tests: PASS, 17/17. No new unit or integration tests were added.
- Git whitespace check: PASS.
- Real HTTP workflow on isolated PostgreSQL: product/warehouse/supplier creation, purchase creation/list/detail, correct line and aggregate totals, ordering, receiving, cancellation, stock transfer, both warehouse histories and paging.
- Two concurrent receipts for one order: exactly one 204 and one 409; stock increased once.
- Repeated receipt and invalid status changes: rejected without additional stock.
- Insufficient transfer: rejected; source and destination quantities unchanged.
- Multi-line receipt with a stock-overflow failure: order remained Ordered, all stock and movement rows remained unchanged.
- Invalid email, duplicate email with different casing, empty/null item entries, excess price precision and invalid pagination: rejected.
- Missing product: 404.
- Browser verification: actual API data rendered; mobile two-line order creation and ordering succeeded; modal keyboard focus and disabled state actions inspected; 390px mobile form had no page-width overflow; forest/indigo palettes and skeletons inspected.
- A server/client field ID mismatch discovered during browser verification was fixed by keeping field-array React keys separate from stable DOM IDs.

## Local preview

The review session runs the API at `http://localhost:5138` and the frontend at `http://localhost:3000` against a separate `inventory-milestone-check` PostgreSQL container on localhost port 55432, database `inventory_verification`. Its example records were created through the real API for verification; no production seed or fake dashboard data was added to the application.

For normal development use the existing compose file and the setup steps in `InventoryManagement.Web/README.md`. The preview does not change the saved application connection string or frontend environment file.

## Next milestone

Milestone 13: Keycloak identity integration. No Keycloak, authentication/authorization, Redis, RabbitMQ, SignalR, observability stack, reporting dashboard, or deployment redesign was introduced in this scope.

