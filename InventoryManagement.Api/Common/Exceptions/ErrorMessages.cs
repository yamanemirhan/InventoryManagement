using System.Globalization;
namespace InventoryManagement.Api.Common.Exceptions;
internal static class ErrorMessages
{
 private static readonly IReadOnlyDictionary<string,string> Turkish = new Dictionary<string,string>
 {
  ["Load your session first."] = "Önce oturumunuzu yenileyin.",
  ["The user must sign in to the application first. Use their account ID."] = "Kullanıcı önce uygulamaya giriş yapmalıdır. Hesap kimliğini kullanın.",
  ["A company must retain at least one owner."] = "Şirketin en az bir sahibi olmalıdır.",
  ["Select a company first."] = "Önce bir şirket seçin.",
  ["Company ownership cannot be changed."] = "Kaydın ait olduğu şirket değiştirilemez.",
  ["Validation Error"] = "Doğrulama hatası",
  ["Not found"] = "Bulunamadı",
  ["Business rule violation"] = "İş kuralı ihlali",
  ["Concurrency conflict"] = "Eşzamanlı değişiklik",
  ["Conflict"] = "Çakışma",
  ["Server error"] = "Sunucu hatası",
  ["An unexpected error occurred. Please try again."] = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
  ["Product not found."] = "Ürün bulunamadı.",
  ["Warehouse not found."] = "Depo bulunamadı.",
  ["Supplier not found."] = "Tedarikçi bulunamadı.",
  ["Purchase order not found."] = "Satın alma siparişi bulunamadı.",
  ["Quantity must be greater than zero."] = "Miktar sıfırdan büyük olmalıdır.",
  ["Stock quantity exceeds the supported maximum."] = "Stok miktarı desteklenen üst sınırı aşıyor.",
  ["Insufficient stock to decrease."] = "Bu işlem için yeterli stok yok.",
  ["Unit price cannot be negative."] = "Birim fiyat negatif olamaz.",
  ["Items can only be added to draft orders."] = "Yalnızca taslak siparişlere ürün eklenebilir.",
  ["A product can only appear once in an order."] = "Bir ürün siparişte yalnızca bir kez yer alabilir.",
  ["Only draft orders can be ordered."] = "Yalnızca taslak siparişler onaylanabilir.",
  ["Order must contain at least one item."] = "Sipariş en az bir ürün içermelidir.",
  ["Only ordered purchases can be received."] = "Yalnızca onaylanmış siparişler teslim alınabilir.",
  ["Only draft or ordered purchases can be cancelled."] = "Yalnızca taslak veya onaylanmış siparişler iptal edilebilir.",
  ["Source and target warehouse cannot be the same."] = "Kaynak ve hedef depo aynı olamaz.",
  ["Product does not exist in source warehouse."] = "Ürün kaynak depoda bulunmuyor.",
  ["A supplier with this email already exists."] = "Bu e-posta adresine sahip bir tedarikçi zaten var.",
  ["SKU already exists."] = "Bu SKU zaten kullanılıyor.",
  ["An order supports at most 100 items."] = "Bir siparişte en fazla 100 ürün bulunabilir.",
  ["Each product must appear only once and cannot be null."] = "Her ürün yalnızca bir kez yer alabilir ve boş olamaz.",
  ["The data was modified by another request."] = "Veri başka bir işlem tarafından değiştirildi. Yenileyip tekrar deneyin.",
  ["Stock was created by another request. Refresh and try again."] = "Stok başka bir işlem tarafından oluşturuldu. Yenileyip tekrar deneyin.",
  ["A record with the same SKU or email already exists."] = "Aynı SKU veya e-posta adresine sahip bir kayıt zaten var.",
  ["A referenced record no longer exists. Refresh and try again."] = "İlgili kayıt artık mevcut değil. Yenileyip tekrar deneyin.",
 };
 public static string Localize(string value) => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "tr" && Turkish.TryGetValue(value, out var translated) ? translated : value;
}
