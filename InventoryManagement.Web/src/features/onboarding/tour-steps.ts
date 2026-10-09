import { Boxes, Building2, ClipboardList, FileSpreadsheet, LayoutDashboard, Package, ScanLine, Sparkles, Warehouse, ChartNoAxesCombined, type LucideIcon } from "lucide-react";

export type TourStep = { id: string; target: string; title: string; description: string; hint: string; icon: LucideIcon };
export type TourText = (tr: string, en: string) => string;

export function getTourSteps(t: TourText, role?: string): TourStep[] {
  const manage = role === "Owner" || role === "Manager";
  const transfer = manage || role === "Operator";
  const nav = (href: string) => `[data-tour-nav="${href}"]`;
  return [
    { id: "company", target: '[data-tour="company"], [data-tour-nav="/companies"]', icon: Building2,
      title: t("Önce şirketin, sonra çalışma alanın", "Your company, your workspace"),
      description: t("Şirket ve ekip ekranından şirket oluşturabilir veya e-posta davetini kabul edebilirsin. Birden fazla şirketteysen üstteki seçim alanıyla geçiş yap.", "Create a company or accept an email invitation in Company & team. If you belong to several companies, switch using the selector at the top."),
      hint: t("Ekranlar ve yetkiler seçili şirkete göre değişir. Her işlemden önce şirketini kontrol et.", "Screens and permissions follow the selected company. Check it before making changes.") },
    { id: "overview", target: nav("/"), icon: LayoutDashboard,
      title: t("Güne genel bakışla başla", "Start with the overview"),
      description: t("Genel bakış, envanterinin özetini ve dikkat gerektiren stok durumlarını bir araya getirir. Günlük kontrolün için başlangıç noktan burası.", "The overview brings together inventory summaries and stock that needs attention. Make this your starting point for daily checks."),
      hint: t("Bu tur sadece alanları tanıtır; hiçbir kaydı oluşturmaz veya değiştirmez.", "This tour only introduces the workspace. It never creates or changes records.") },
    { id: "products", target: nav("/products"), icon: Package,
      title: t("Ürün kataloğunu tanı", "Meet your product catalog"),
      description: manage
        ? t("Ürünlerini ad, benzersiz SKU ve isteğe bağlı barkodla ekle. Ürün detayında QR ve barkod etiketlerini indirip yazdırabilirsin.", "Add products with a name, unique SKU and optional barcode. Download or print QR and barcode labels from product details.")
        : t("Ürünleri ve SKU bilgilerini buradan incele. Katalog ekleme ve düzenleme işlemlerini şirket sahibi veya yöneticisi yapar.", "Review products and SKUs here. Company Owners and Managers create and edit the catalog."),
      hint: t("Stok girmeden önce ürünün katalogda bulunması gerekir.", "A product must exist in the catalog before you receive stock.") },
    { id: "warehouses", target: nav("/warehouses"), icon: Warehouse,
      title: t("Stokların yerini belirle", "Give your stock a location"),
      description: t("Depolar fiziksel veya mantıksal stok konumlarını temsil eder. Depo detayında o konumun ürünlerini ve hareket geçmişini görebilirsin.", "Warehouses represent physical or logical stock locations. Each warehouse shows its products and movement history."),
      hint: t("Başlangıç sırası: ürünler → depolar → stok girişi.", "Start in this order: products → warehouses → stock receipt.") },
    { id: "stocks", target: nav("/stocks"), icon: Boxes,
      title: t("Stok hareketlerini buradan yönet", "Follow your stock movements"),
      description: manage
        ? t("Depoya stok girişi yap, iki depo arasında transfer oluştur ve minimum stok seviyelerini belirle. Kaydetmeden önce ürün, depo ve miktarı kontrol et.", "Receive stock, transfer between warehouses and set minimum stock levels. Check the product, warehouse and quantity before confirming.")
        : transfer
          ? t("Stok miktarlarını inceleyebilir ve depolar arasında transfer yapabilirsin. Stok girişi ve eşik ayarları şirket sahibi veya yöneticisine aittir.", "Review quantities and transfer stock between warehouses. Stock receipt and threshold settings belong to Owners and Managers.")
          : t("Seçili şirketin depo bazlı stoklarını ve minimum stok uyarılarını incele. Değişiklik yapma yetkisi şirket rolüne bağlıdır.", "Review warehouse quantities and minimum-stock warnings. Your company role determines which changes you can make."),
      hint: t("Transferde kaynak ve hedef farklı olmalı; kaynakta yeterli stok bulunmalı.", "Transfers need different source and destination warehouses and enough source stock.") },
    { id: "purchases", target: nav("/purchase-orders"), icon: ClipboardList,
      title: t("Tedarikten teslim almaya", "From purchasing to receipt"),
      description: t("Önce Tedarikçiler ekranında tedarikçiyi tanımla. Satın alma siparişleriyle taslak, sipariş ve kısmi teslim alma sürecini takip et.", "Set up the supplier in Suppliers first. Purchase orders track drafts, ordering and partial receipts."),
      hint: t("Taslak sipariş stok artırmaz. Stok, yetkili kullanıcı teslim almayı onayladığında değişir.", "A draft order does not increase stock. Stock changes when an authorized user confirms receipt.") },
    ...(manage ? [{ id: "imports", target: nav("/imports"), icon: FileSpreadsheet,
      title: t("Tek tek eklemek zorunda değilsin", "Skip repetitive data entry"),
      description: t("CSV veya Excel şablonunu indir; ürün, depo, tedarikçi, açılış stoku ya da taslak siparişleri topluca aktar. Önizlemedeki hataları düzeltip sonra onayla.", "Download a CSV or Excel template to import products, warehouses, suppliers, opening stock or draft orders. Fix preview errors before confirming."),
      hint: t("En fazla 1.000 satır / 1 MB. Açılış stoku mevcut stokları üzerine yazmaz.", "Up to 1,000 rows / 1 MB. Opening stock never overwrites existing stock.") }] : []),
    { id: "scan", target: nav("/scan"), icon: ScanLine,
      title: t("Yazmak yerine kod okut", "Scan instead of typing"),
      description: t("Kamera, barkod okuyucu veya görselle ürünü bul. USB okuyucuda kod alanını seçip okut; okuyucu Enter ile aramayı tamamlar.", "Find products with a camera, barcode reader or image. Focus the code field for a USB reader; its Enter suffix completes the lookup."),
      hint: t("Kod okutmak tek başına stok değiştirmez. Kamera için tarayıcı izni gerekir.", "Scanning alone never changes stock. Camera access needs browser permission.") },
    { id: "reports", target: nav("/reports"), icon: ChartNoAxesCombined,
      title: t("Raporlarla kontrolü elinde tut", "Stay in control with reports"),
      description: t("Depo ve ürün bazlı raporları incele, hareketleri filtrele ve sayım ekranıyla fiziksel stokları karşılaştır. Yetkili kullanıcılar sayım farkını gerekçeyle onaylar.", "Review warehouse and product reports, filter movements and compare physical stock with inventory counts. Authorized users confirm count adjustments with a reason."),
      hint: t("Minimum stok uyarılarını günlük kontrolüne dahil et.", "Include minimum-stock warnings in your daily checks.") },
    { id: "assistant", target: '[data-tour="assistant"]', icon: Sparkles,
      title: t("Takıldığında Invo yanında", "Invo is here when you need help"),
      description: t("Sağ alttaki Invo günlük iş akışlarında yol gösterir. AI yanıtları henüz etkin değilse hızlı bağlantıları kullanabilirsin. Üstteki bildirim alanından canlı şirket güncellemelerini takip et.", "Invo at the bottom right guides daily workflows. Use its quick links while AI replies await activation. Follow live company updates in the notification area at the top."),
      hint: t("Hazırsın! Bu turu menüdeki Uygulama turu düğmesinden tekrar açabilirsin.", "You're ready! Restart any time using App tour in the menu.") },
  ];
}
