namespace InventoryManagement.Application.Assistant;

internal static class LocalAssistantReply
{
    internal static AssistantReply Create(AssistantContext? context, string locale, string? notice = null, int retry = 0)
    {
        var tr = locale == "tr";
        if (context is null)
            return new(tr
                ? "Envanter akışı: ürün, depo ve tedarikçileri tanımla; açılış stoklarını gir veya Excel ile aktar; minimum stokları belirle. Stok transferi ve sayım işlemlerini ilgili ekranlarda onayla. Şirketine ait güncel veriler ve belgeler için Şirketim modunu kullan. Bulut açıklamaları isteğe bağlıdır."
                : "Inventory workflow: create products, warehouses and suppliers; enter opening stock or import Excel; set minimum stock levels. Confirm transfers and counts on their screens. Use My company mode for current records and documents. Cloud explanations are optional.",
                Mode: "local", NoticeCode: notice, RetryAfterSeconds: retry);
        var sections = new List<string> { tr
            ? "Şirketindeki güncel kayıtlardan ve yayınlanmış belgelerden bulunan bilgiler aşağıda. Bu yanıt yerel arama sonucudur; dil modeli yorumu değildir."
            : "Below are matches from your company's current records and published documents. This is local retrieval, not a language-model interpretation." };
        if (context.Sources.Count == 0)
            sections.Add(tr ? "Soruna uygun kaynak bulunamadı. Ürün adı/SKU veya belgedeki belirgin kelimelerle yeniden sor. Gerekirse Bilgi kaynakları bölümünde bir rehber yayınla."
                : "No matching source was found. Try a product name/SKU or specific document keywords. Publish a guide in Knowledge resources if needed.");
        foreach (var source in context.Sources)
            sections.Add($"[{source.Key}] {source.Title}\n{source.Excerpt}");
        if (context.Insights.Count > 0)
        {
            sections.Add(tr ? "Kontrol etmeye değer durumlar:" : "Items worth reviewing:");
            sections.AddRange(context.Insights.Take(3).Select(x => $"• {x.Title}: {x.Detail}"));
        }
        var text = string.Join("\n\n", sections);
        return new(text.Length > 11000 ? text[..11000] : text, Truncated: text.Length > 11000, Sources: context.Sources, Mode: "local", NoticeCode: notice,
            RetryAfterSeconds: retry, RetrievedAtUtc: context.RetrievedAtUtc);
    }
}
