using System.Text.RegularExpressions;
using InventoryManagement.Application.Assistant;
using InventoryManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NpgsqlTypes;

namespace InventoryManagement.Infrastructure.Persistence.Repositories;

public sealed class AssistantContextReader(AppDbContext db) : IAssistantContextReader
{
    private static readonly HashSet<string> StopWords = new("benim bana şirketim şirketimde hangi nasıl nedir için göre öner öneri ve bir bu şu the what how my company can you with from this that should please help".Split(' '));
    private static string[] Terms(string text) => Regex.Matches(text.ToLowerInvariant(), @"[\p{L}\p{N}]+")
        .Select(x => x.Value).Where(x => x.Length >= 2 && !StopWords.Contains(x)).Distinct().Take(12).ToArray();

    public async Task<AssistantContext> RetrieveAsync(string question, string locale, string page, CancellationToken ct)
    {
        var tr = locale == "tr";
        var terms = Terms(question);
        var sources = new List<AssistantSource>();
        // These queries retain the DbContext company filter. Published resources only,
        // including for managers. Structured contact fields are not selected; published
        // document text is user-authored and must be reviewed before external processing.
        if (terms.Length > 0)
        {
            var search = string.Join(" | ", terms);
            var documents = await db.KnowledgeDocuments.AsNoTracking().Where(x => x.Status == "Published"
                && (EF.Property<NpgsqlTsVector>(x, "SearchVector").Matches(EF.Functions.ToTsQuery("simple", search))
                    || EF.Property<NpgsqlTsVector>(x, "SearchVector").Matches(EF.Functions.ToTsQuery("turkish", search))
                    || EF.Property<NpgsqlTsVector>(x, "SearchVector").Matches(EF.Functions.ToTsQuery("english", search))))
                .OrderByDescending(x => EF.Property<NpgsqlTsVector>(x, "SearchVector").Rank(EF.Functions.ToTsQuery("simple", search)))
                .ThenByDescending(x => x.UpdatedAtUtc).ThenBy(x => x.Id)
                .Take(4).Select(x => new { x.Id, x.Title, x.Content, x.Revision }).ToListAsync(ct);
            foreach (var document in documents)
                sources.Add(new($"S{sources.Count + 1}", "document", document.Id, document.Title,
                    Excerpt(document.Content, terms), $"/knowledge/{document.Id}", document.Revision));

            var normalizedQuestion = question.ToLowerInvariant();
            var products = await db.Products.AsNoTracking().Where(x => !x.IsDeleted
                && (normalizedQuestion.Contains(x.SKU.ToLower()) || terms.Any(term => x.Name.ToLower().Contains(term))))
                .OrderByDescending(x => normalizedQuestion.Contains(x.SKU.ToLower()))
                .ThenBy(x => x.SKU).ThenBy(x => x.Id).Take(3).Select(x => new { x.Id, x.Name, x.SKU }).ToListAsync(ct);
            foreach (var product in products)
            {
                var stock = await (from s in db.Stocks.AsNoTracking()
                    join w in db.Warehouses on s.WarehouseId equals w.Id
                    where s.ProductId == product.Id
                    orderby w.Name, w.Id
                    select new { w.Name, s.Quantity, s.MinimumQuantity }).Take(8).ToListAsync(ct);
                var text = $"SKU: {product.SKU}. " + (stock.Count == 0
                    ? (tr ? "Tanımlı depo stoğu yok." : "No warehouse stock record.")
                    : string.Join("; ", stock.Select(x => tr ? $"{x.Name}: {x.Quantity} birim, minimum {x.MinimumQuantity}"
                        : $"{x.Name}: {x.Quantity} units, minimum {x.MinimumQuantity}")));
                sources.Add(new($"S{sources.Count + 1}", "product", product.Id, product.Name, text.Length > 1200 ? text[..1200] + "…" : text, $"/products/{product.Id}"));
            }
        }
        var insightPage = page is "products" or "stocks" or "purchases" or "reports" or "knowledge" ? page : "overview";
        var insights = await GetInsightsAsync(locale, insightPage, ct);
        return new(insights.RetrievedAtUtc, sources, insights.Items);
    }

    private static string Excerpt(string content, string[] terms)
    {
        // Bounded overlapping passages; rank on the question and preserve the actual
        // document text instead of inventing a summary. No persistent conversation cache.
        const int length = 900, stride = 700;
        var passages = new List<(string Text, int Score, int Offset)>();
        for (var offset = 0; offset < content.Length; offset += stride)
        {
            var passage = content.Substring(offset, Math.Min(length, content.Length - offset));
            var score = terms.Count(term => passage.Contains(term, StringComparison.OrdinalIgnoreCase));
            passages.Add((passage, score, offset));
        }
        var best = passages.OrderByDescending(x => x.Score).ThenBy(x => x.Offset).FirstOrDefault();
        return (best.Offset > 0 ? "…" : "") + best.Text + (best.Offset + length < content.Length ? "…" : "");
    }

    public async Task<AssistantInsights> GetInsightsAsync(string locale, string page, CancellationToken ct)
    {
        var tr = locale == "tr";
        var items = new List<AssistantInsight>();
        if (page is "overview" or "stocks" or "reports" or "products")
        {
            var low = await (from s in db.Stocks.AsNoTracking()
                join p in db.Products on s.ProductId equals p.Id
                join w in db.Warehouses on s.WarehouseId equals w.Id
                where !p.IsDeleted && s.MinimumQuantity > 0 && s.Quantity < s.MinimumQuantity
                orderby s.Quantity == 0 descending, s.MinimumQuantity - s.Quantity descending, p.Id, w.Id
                select new { ProductId = p.Id, p.Name, p.SKU, WarehouseId = w.Id, WarehouseName = w.Name, s.Quantity, s.MinimumQuantity })
                .Take(3).ToListAsync(ct);
            foreach (var row in low)
            {
                var inbound = await (from line in db.PurchaseOrderItems.AsNoTracking()
                    join order in db.PurchaseOrders on EF.Property<Guid>(line, "PurchaseOrderId") equals order.Id
                    where line.ProductId == row.ProductId && order.WarehouseId == row.WarehouseId
                        && (order.Status == PurchaseOrderStatus.Ordered || order.Status == PurchaseOrderStatus.PartiallyReceived)
                    select (long)line.Quantity - line.ReceivedQuantity).SumAsync(ct);
                var spare = await (from s in db.Stocks.AsNoTracking()
                    join w in db.Warehouses on s.WarehouseId equals w.Id
                    where s.ProductId == row.ProductId && s.WarehouseId != row.WarehouseId && s.Quantity > s.MinimumQuantity
                    orderby s.Quantity - s.MinimumQuantity descending, w.Id
                    select new { w.Name, Available = (long)s.Quantity - s.MinimumQuantity }).FirstOrDefaultAsync(ct);
                var deficit = Math.Max(0, (long)row.MinimumQuantity - row.Quantity - inbound);
                var detail = tr ? $"{row.WarehouseName}: {row.Quantity}/{row.MinimumQuantity} birim. Onaylı siparişlerde beklenen {inbound} birim var. "
                    : $"{row.WarehouseName}: {row.Quantity}/{row.MinimumQuantity} units. Confirmed purchases have {inbound} units outstanding. ";
                if (deficit == 0)
                    detail += tr ? "Yeni sipariş açmadan mevcut siparişin teslimatını kontrol et." : "Check delivery of the existing purchase before ordering more.";
                else if (spare is not null)
                    detail += tr ? $"{spare.Name} deposundan en fazla {Math.Min(deficit, spare.Available)} birim transferi değerlendir; kaynak deposunun minimumunu koru."
                        : $"Consider transferring up to {Math.Min(deficit, spare.Available)} units from {spare.Name}, preserving its minimum.";
                else
                    detail += tr ? $"Tanımlı minimuma ulaşmak için {deficit} ek birim gerekiyor; tedarik süresi ve gerçek talebi kontrol et."
                        : $"Another {deficit} units are needed to reach the configured minimum; check lead time and actual demand.";
                items.Add(new($"low-{row.ProductId}-{row.WarehouseId}", row.Quantity == 0 ? "critical" : "warning",
                    tr ? $"{row.Name} · minimumun altında" : $"{row.Name} · below minimum", detail,
                    "/reports", tr ? $"{row.SKU} için stokları ve yayınlanmış rehberleri incele." : $"Review stock and published guides for {row.SKU}."));
            }
            var missing = await db.Stocks.CountAsync(s => s.MinimumQuantity == 0 && db.Products.Any(p => p.Id == s.ProductId && !p.IsDeleted), ct);
            if (missing > 0 && items.Count < 4)
                items.Add(new("minimum-disabled", "info", tr ? "Minimum stok uyarıları kapalı" : "Minimum stock alerts disabled",
                    tr ? $"{missing} ürün/depo kaydında minimum 0. Kritik ürünlerde seviyeyi belirle; 0 olanlarda düşük stok uyarısı oluşmaz."
                        : $"{missing} product/warehouse records have a zero minimum. Set levels for critical products; zero disables low-stock alerts.",
                    "/reports", tr ? "Minimum stok seviyelerini belirlerken nelere dikkat etmeliyim?" : "How should I choose minimum stock levels?"));
        }
        if (page is "overview" or "purchases")
        {
            var cutoff = DateTime.UtcNow.AddDays(-14);
            var old = await db.PurchaseOrders.CountAsync(x => x.CreatedAtUtc < cutoff
                && (x.Status == PurchaseOrderStatus.Ordered || x.Status == PurchaseOrderStatus.PartiallyReceived), ct);
            if (old > 0)
                items.Add(new("older-purchases", "warning", tr ? "Uzun süredir açık siparişler" : "Long-open purchases",
                    tr ? $"14 günden önce oluşturulmuş {old} onaylı/kısmi teslim siparişi var. Tedarikçiyle kalan teslimatı kontrol et. Taahhüt edilen teslim tarihi kayıtlı olmadığından bunlara gecikmiş demiyoruz."
                        : $"{old} confirmed/partially received purchases were created over 14 days ago. Check remaining delivery. They are not classified overdue because no promised delivery date is recorded.",
                    "/purchase-orders", tr ? "Açık siparişler ve stok eksikleri için neyi kontrol etmeliyim?" : "What should I check for open purchases and shortages?"));
        }
        if (page == "knowledge" || (page == "overview" && items.Count == 0))
        {
            var count = await db.KnowledgeDocuments.CountAsync(x => x.Status == "Published", ct);
            if (count == 0)
                items.Add(new("publish-guide", "info", tr ? "Şirkete özel bilgi kaynağı ekle" : "Add company knowledge",
                    tr ? "Depo kuralları, stok politikaları ve ürün rehberlerini yayınla. Invo yalnızca yayınlanmış belgeleri kaynak olarak kullanır."
                        : "Publish warehouse rules, stock policies and product guides. Invo retrieves only published documents.",
                    "/knowledge", tr ? "Şirketimin depo ve stok kurallarını bul." : "Find my company's warehouse and stock rules."));
        }
        return new(DateTime.UtcNow, items.Take(4).ToArray());
    }
}
