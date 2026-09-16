# Şirketli yapıya geçiş planı

## 1. Aşama — Ana iskelet (uygulandı)

- Kimlik doğrulama Keycloak'ta kalır; şifreler iş veritabanına alınmaz.
- `ApplicationUsers`: uygulamaya giriş yapan hesabın Keycloak `sub`, adı ve e-postası.
- `Companies`: şirket adı, aktiflik ve oluşturulma tarihi.
- `CompanyMembers`: hesap ile şirket arasında çoktan çoğa üyelik; her şirkette ayrı rol.
- `/companies`: ilk şirketi oluşturma, hesap kimliği, ekip üyeleri ve rol yönetimi.
- Üst menü: erişilebilen aktif şirketler arasında seçim. Seçim sekme bazında tutulur.
- `/admin`: platform yöneticisine şirketler, uygulamaya giriş yapan kullanıcılar, şirket adı/aktiflik yönetimi, ekip yönetimi ve şirket çalışma alanına geçiş.
- Türkçe/İngilizce arayüz, mevcut tema ve bileşenler kullanılır.

| İşlem | Sahip | Yönetici | Operatör | İzleyici |
| --- | --- | --- | --- | --- |
| Şirket envanterini görüntüleme | Evet | Evet | Evet | Evet |
| Depolar arası transfer | Evet | Evet | Evet | Hayır |
| Ürün/depo/tedarikçi ve satın alma yönetimi | Evet | Evet | Hayır | Hayır |
| Stok girişi ve sipariş teslim alma | Evet | Evet | Hayır | Hayır |
| Üye ekleme/çıkarma ve rol atama | Evet | Hayır | Hayır | Hayır |

Keycloak `Admin` rolü platform yöneticisidir; tüm şirketlerin yönetimine erişir. Şirket sahibi olmak platform Admin yetkisi vermez. Yeni şirket oluşturan kullanıcı o şirketin sahibi olur. Keycloak `User` rolü tek başına mevcut şirket verilerine erişim vermez.

### Üyelik akışı

Kullanıcı bir kez giriş yapar, Şirket ve ekip ekranındaki hesap kimliğini şirket sahibine iletir. Sahip bu kimlikle üyelik ve rol atar. Kullanıcı ekranı yenilediğinde veya sekmeye yeniden odaklandığında şirket listesi güncellenir. E-posta daveti henüz yoktur. Son sahip çıkarılamaz veya daha düşük role indirilemez; eşzamanlı üyelik değişiklikleri şirket satırı kilidiyle sıralanır.

### Veri sınırı

Envanter istekleri `X-Company-Id` taşır. API her istekte aktif şirket ve güncel üyelik kontrolü yapar. EF sorgu filtreleri yalnızca seçilen şirketin kayıtlarını döndürür; yazma işlemleri şirket kimliğini sunucuda atar. Birleşik yabancı anahtarlar şirketler arası ürün/depo/tedarikçi/sipariş referanslarını engeller. SKU ve tedarikçi e-postası şirket içinde benzersizdir. Platform Admin'i de envanter işlemleri için bir şirket seçer.

Şirket değişikliği tam sayfa geçişiyle React Query önbelleğini, Redux depo seçimini ve açık formları sıfırlar. Böylece önceki şirketin ayrıntı ekranları veya geç tamamlanan istekleri yeni şirket ekranına taşınmaz.

## 2. Aşama — Ekip deneyimi (sonraki iş)

- Süreli e-posta daveti, kabul/ret, yeniden gönderme ve daveti iptal etme.
- Üyelik ve yönetim değişiklikleri için denetim kayıtları.
- Şirket profil bilgileri, kullanıcı dizininde arama/sayfalama.
- Gerekirse şirket devri için ayrı, yönlendirmeli akış.

## 3. Aşama — İş ihtiyaçları netleşince

- Depo bazında erişim, özel yetki grupları.
- Onay akışları, bildirimler, raporlar ve şirket kullanım limitleri.

## Veritabanı geçişi ve yayınlama

Migration: `20260915160854_CompanyWorkspaces`.

1. Hedef iş veritabanını yedekleyin; eski API yazmalarını durdurun.
2. Migration'ı yeni API sürümüyle uygulayın. Mevcut deploy scriptleri migration profilini zaten çalıştırıyor.
3. API ve ön yüzü birlikte yayınlayın; eski ön yüz şirket başlığı göndermez.
4. Platform Admin hesabıyla giriş yapın. Eski veri varsa **Mevcut şirket** görünür; veriler bu şirkete taşınır (kimlik: `11111111-1111-4111-8111-111111111111`). Temiz veritabanında bu şirket oluşturulmaz.
5. Bu şirkete gerçek sahibini/üyelerini yönetim ekranından ekleyin. Eski kullanıcılar otomatik üye yapılmaz; platform Admin ilk atamayı yapar.

Yerel migration komutu:

```powershell
dotnet ef database update --project InventoryManagement.Infrastructure --startup-project InventoryManagement.Api
```

Bağlantı bilgilerini hedef ortamın gizli ortam değişkenlerinden sağlayın. Bu çalışma sunucu ayarlarını değiştirmez. Uygulama migration'ı başlangıçta otomatik çalıştırmaz.

Çok şirketli veriyi yeniden ortak havuza indirmek güvenli değildir; bu migration'ın `Down` işlemi bilinçli olarak kapalıdır. Geri dönüş eski veritabanı yedeği ve uyumlu eski uygulama sürümü birlikte geri yüklenerek yapılır. Yalnızca eski uygulama imajını yayınlamak yeterli değildir.

## Doğrulama

Test yazılmadı ve test takımları çalıştırılmadı. API Release derlemesi, ön yüz TypeScript/lint/üretim derlemesi, migration SQL üretimi ve EF model–migration tutarlılığı kontrol edilir. Canlı veritabanında migration ve giriş yapılarak uçtan uca kullanım doğrulaması yayınlama öncesi ayrıca gereklidir.
