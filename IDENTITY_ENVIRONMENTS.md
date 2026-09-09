# Kimlik ortamları: e-posta, Google ve Keycloak

Bu belge geliştiriciler ve sunucu yöneticileri için yeniden kullanılabilir kurulum kılavuzudur. E-posta girişi **e-posta + şifre** anlamına gelir; şifresiz e-posta bağlantısı veya OTP akışı değildir. Google girişi de Keycloak üzerinden gerçekleşir.

## 1. Ortamları ayırın

`/products` gibi sayfa yollarını APP_ORIGIN'e yazmayın.

| Ayar | Development | Staging | Production |
| --- | --- | --- | --- |
| APP_ORIGIN | http://localhost:3000 | https://staging-inventory-yamanemirhan.duckdns.org | https://inventory-yamanemirhan.duckdns.org |
| KEYCLOAK_URL | http://localhost:8088 | https://staging-inventory-yamanemirhan.duckdns.org/identity | https://inventory-yamanemirhan.duckdns.org/identity |
| Realm | inventory-development | inventory-staging | inventory-production |
| Sunucuda localhost portu | 8088 | 8181 | 8180 |
| Keycloak DB SSH tünel portu | 5433 | 55433 | 55434 |

Staging ve production için ayrı Keycloak instance'ları, veritabanları, volume'ler, yönetici şifreleri ve Google OAuth istemcileri kullanılır. Nginx mevcut HTTPS domaininin `/identity/` yolunu Keycloak'a aktarır. Sunucu compose dosyası `start` kullanır; yerel `start-dev` dosyasını sunucuda kullanmayın.

**Sıra:** Önce kimlik servisini ve SMTP'yi hazırlayın, ardından Google sağlayıcısını yapılandırın, son olarak uygulamayı `develop` dalıyla dağıtın. Uygulama workflow'u Keycloak'ı otomatik kurmaz.

### DBeaver bağlantıları

Canlı veritabanı portlarını internete açmayın. DBeaver'da her bağlantının **SSH** sekmesinde **Use SSH Tunnel** seçin; SSH host `9.205.25.11`, kullanıcı `azureuser`, kimlik doğrulama yöntemi public key ve yerel anahtar dosyası `~/.ssh/inventory-management-azure` olmalıdır. **Main** sekmesinde aşağıdaki hedefleri kullanın:

| Profil | Host | Port | Database | Kullanıcı |
| --- | --- | ---: | --- | --- |
| Inventory App — Staging | psql-inventory-yamanemirhan.postgres.database.azure.com | 5432 | inventory_staging | inventoryadmin |
| Inventory App — Production | psql-inventory-yamanemirhan.postgres.database.azure.com | 5432 | inventory_production | inventoryadmin |
| Keycloak — Staging | 127.0.0.1 | 55433 | keycloak | keycloak |
| Keycloak — Production | 127.0.0.1 | 55434 | keycloak | keycloak |

Uygulama DB parolasını sunucudaki ilgili `/opt/inventory-management/.env.*` dosyasındaki mevcut bağlantı dizesinden, Keycloak DB parolasını ilgili doldurulmuş ve Git tarafından yok sayılan `.env.identity.*` dosyasından alın. Parolaları bu belgeye, DBeaver export'una veya Git'e yazmayın. Azure PostgreSQL public access kapalıdır; bağlantı SSH tüneli üzerinden VM'nin private ağ erişimini kullanır. Production Keycloak profili, production identity servisi kurulana kadar bağlanmaz.

## 2. Bilgisayarda Keycloak'ı açın

Repo kökünde PowerShell:

```powershell
# İlk kurulumda; mevcut dosyanın üzerine yazmayın.
Copy-Item deploy/keycloak/.env.example .env.identity
```

`.env.identity` dosyasında `KEYCLOAK_ADMIN_PASSWORD` ve `KEYCLOAK_DB_PASSWORD` alanlarına **farklı** rastgele şifreler yazın. Güvenilir bir parola yöneticisinin üreteci kullanılabilir. Dosya Git tarafından yok sayılır; içine yazdığınız değerleri commit etmeyin.

```powershell
docker compose --env-file .env.identity -f compose.identity.yml up -d
```

`http://localhost:8088/admin/` adresini açın. `.env.identity` içindeki `KEYCLOAK_ADMIN_USERNAME` ve `KEYCLOAK_ADMIN_PASSWORD` ile giriş yapın. Üstteki realm listesinden **inventory-development** seçin. `master`, uygulamanın realm'i değildir.

Mevcut kalıcı veritabanı varsa `.env.identity` içindeki DB şifresini rastgele değiştirmeyin. Import yalnızca bulunmayan realm'i oluşturur; JSON'u değiştirmek mevcut realm'i güncellemez.

## 3. Staging kimlik servisini push öncesinde kurun

Bilgisayarınızda repo kökünde:

```powershell
Copy-Item deploy/keycloak/staging.env.example .env.identity.staging
```

`.env.identity.staging` içini doldurun:

```dotenv
IDENTITY_ENVIRONMENT=staging
APP_ORIGIN=https://staging-inventory-yamanemirhan.duckdns.org
KEYCLOAK_URL=https://staging-inventory-yamanemirhan.duckdns.org/identity
KEYCLOAK_AUTHORITY=https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging
IDENTITY_HTTP_PORT=8181
IDENTITY_DB_PORT=55433
KEYCLOAK_ADMIN_USERNAME=identity-admin
KEYCLOAK_ADMIN_PASSWORD=BURAYA_YENI_RASTGELE_YONETICI_SIFRESI
KEYCLOAK_DB_PASSWORD=BURAYA_FARKLI_RASTGELE_VERITABANI_SIFRESI
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Örnek şifre metinlerini aynen kullanmayın. Google alanlarını 7. adımda dolduracaksınız. Secret içinde `$` veya `#` varsa dotenv/Compose yorumlamasından kaçınmak için değeri tek tırnak içine alın; rastgele alfanümerik şifre üretmek de mümkündür.

Secret içermeyen realm dosyasını üretin:

```powershell
node scripts/configure-identity.mjs realm .env.identity.staging
```

Çıktı: `.local/identity/realms/inventory-staging-realm.json`. `.local/` Git ve Docker dışında tutulur.

Aşağıdaki `SUNUCU_KULLANICISI` ve `SUNUCU_IP` alanları mevcut SSH hesabınız ve sunucu adresinizdir. Kimlik dosyalarını uygulamanın `/opt/inventory-management` Git checkout'una kopyalamayın; dağıtım script'i kirli checkout'u reddeder.

```powershell
ssh SUNUCU_KULLANICISI@SUNUCU_IP "mkdir -p ~/inventory-identity-setup/staging/realms && chmod 700 ~/inventory-identity-setup"
scp compose.identity.server.yml SUNUCU_KULLANICISI@SUNUCU_IP:inventory-identity-setup/staging/
scp .env.identity.staging SUNUCU_KULLANICISI@SUNUCU_IP:inventory-identity-setup/staging/.env.identity
scp .local/identity/realms/inventory-staging-realm.json SUNUCU_KULLANICISI@SUNUCU_IP:inventory-identity-setup/staging/realms/
```

Sunucuya SSH ile bağlanın ve çalıştırın:

```sh
sudo mkdir -p /opt/inventory-identity/staging
sudo cp -a ~/inventory-identity-setup/staging/. /opt/inventory-identity/staging/
sudo chmod 700 /opt/inventory-identity/staging
sudo chmod 600 /opt/inventory-identity/staging/.env.identity
chmod 600 ~/inventory-identity-setup/staging/.env.identity
sudo docker compose --project-directory /opt/inventory-identity/staging --env-file /opt/inventory-identity/staging/.env.identity -f /opt/inventory-identity/staging/compose.identity.server.yml up -d
sudo docker compose --project-directory /opt/inventory-identity/staging --env-file /opt/inventory-identity/staging/.env.identity -f /opt/inventory-identity/staging/compose.identity.server.yml logs --tail 40 keycloak
```

Realm JSON'u container kullanıcısının okuyabileceği şekilde bırakın; tüm dosyalara topluca `chmod 600` uygulamayın. Kimlik DB volume'ünü koruyun; yeniden başlatırken `down -v` kullanmayın. Sunucu identity ortamının yedeğini alın.

İlk import yalnız bulunmayan realm'i oluşturur. Domain, redirect URI veya client güvenlik ayarları sonradan değiştiğinde doldurulmuş yerel env dosyasıyla idempotent senkronizasyonu çalıştırın:

```powershell
node scripts/configure-identity.mjs sync .env.identity.staging
```

Bu komut mevcut realm'i silmez; kayıt, dil, redirect, public-client, Authorization Code flow, PKCE S256 ve logout ayarlarını günceller. İşlem sonunda client attribute'lerini yeniden okuyarak doğrular. `KEYCLOAK_ADMIN_USERNAME` alanında geçici bootstrap hesabı yerine aktif, kalıcı ve yalnız hedef realm'i yönetebilen hesap bulunmalıdır.

## 4. Nginx'te /identity yolunu açın

Sunucuda `sudo nginx -T` ile staging domaininin `server_name` satırını bulun. Çıktıdaki `# configuration file ...` satırı düzenlenecek gerçek dosyayı gösterir. Bu domainin **443 SSL server bloğuna**, mevcut `/api/` ve `/` bloklarını koruyarak şunları ekleyin:

```nginx
location = /identity {
    return 308 /identity/;
}

location ^~ /identity/ {
    proxy_pass http://127.0.0.1:8181;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 443;
    proxy_set_header X-Forwarded-Prefix "";
    proxy_set_header Forwarded "";
}
```

`proxy_pass` sonuna `/` eklemeyin: `/identity` yolu korunmalıdır. Repo içindeki `deploy/nginx/inventory-management-staging.conf` ve production karşılığı bu bloğu içerir; Git'e push, sistemdeki aktif Nginx dosyasını kendiliğinden güncellemez.

```sh
sudo nginx -t && sudo systemctl reload nginx
curl --fail https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging/.well-known/openid-configuration
```

Yanıttaki `issuer` tam olarak `https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging` olmalıdır. Yeni bir dış port açmayın: 8181 yalnızca localhost'a bağlıdır, kullanıcılar 443 üzerinden gelir. Bu kurulumda TLS aynı makinedeki Nginx'te sonlanır. Ayrı makinelerdeki proxy/Keycloak için dahili bağlantıya da TLS gerekir. [Keycloak reverse proxy rehberi](https://www.keycloak.org/server/reverseproxy)

Yönetim adresi: `https://staging-inventory-yamanemirhan.duckdns.org/identity/admin/`. `.env.identity.staging` içindeki yöneticiyle giriş yapın, realm olarak **inventory-staging** seçin. Bootstrap yöneticisiyle ilk kurulumdan sonra Keycloak'ın önerdiği kalıcı yönetici hesabını oluşturun ve geçici bootstrap hesabını kaldırın. Daha sonra Google script'i kullanılacaksa `.env.identity.staging` içine aktif yöneticinin bilgilerini yazın.

## 5. E-posta + şifre girişini açın

Doğru realm'de **Realm settings → Login** bölümüne gidin:

| Ayar | Değer |
| --- | --- |
| User registration | On |
| Email as username | On |
| Login with email | On |
| Duplicate emails | Off |
| Forgot password | On |
| Verify email | On; önce 6. adımda SMTP'yi doğrulayın |

Import bu ayarların çoğunu hazır getirir. **Clients → inventory-web** ekranında:

- Client authentication: **Off** (public client).
- Standard flow: **On**; Direct access grants ve Implicit flow: **Off**.
- Valid redirect URIs: `https://staging-inventory-yamanemirhan.duckdns.org/auth/callback`.
- Valid post logout redirect URIs: `https://staging-inventory-yamanemirhan.duckdns.org/auth/login`.
- Web origins: `https://staging-inventory-yamanemirhan.duckdns.org`.
- PKCE method: **S256**.

Wildcard (`*`) eklemeyin. `inventory-api` audience mapper'ını koruyun; bununla ilgili özel bir Google ayarı yoktur.

Uygulamada **Create an account** ile kayıt olun, doğrulama e-postasındaki bağlantıyı açın, ardından **Sign in with email** ile e-posta/şifre girin. Keycloak'ta **Users → kullanıcınız → Role mapping → Assign role → Filter by realm roles → Admin → Assign** ile kendi operatör hesabınıza Admin verin. Yeni kayıtlarda varsayılan rol User'dır; varsayılanı Admin yapmayın.

## 6. SMTP: doğrulama ve parola sıfırlama e-postaları

**Realm settings → Email** ekranına gidin. E-posta sağlayıcınızın panelinden SMTP Host, Port, Username ve Password bilgilerini alın ve yalnızca Keycloak'a yazın. Bunlar frontend `.env.local` dosyasına girilmez.

Gmail kullanıyorsanız Google hesabında **Güvenlik → 2 Adımlı Doğrulama** açın. Sonra [Uygulama şifreleri](https://myaccount.google.com/apppasswords) sayfasında Keycloak için bir uygulama şifresi oluşturun. Normal Gmail şifrenizi kullanmayın. Bu seçenek hesabınızda yoksa desteklenen başka bir SMTP sağlayıcısı seçin; bazı kuruluş/gelişmiş koruma ayarları bu seçeneği sunmaz. [Google açıklaması](https://support.google.com/accounts/answer/185833?hl=tr)

Gmail örneği:

| Keycloak alanı | Yazılacak değer |
| --- | --- |
| From | Gönderen Gmail adresiniz |
| From display name | Inventory Management |
| Host | smtp.gmail.com |
| Port | 587 |
| Enable SSL | Off |
| Enable StartTLS | On |
| Enable Authentication | On |
| Username | Gmail adresiniz |
| Password | Oluşturduğunuz uygulama şifresi |

Bu değerleri doldurulmuş, Git tarafından yok sayılan identity env dosyasına yazıp script ile de uygulayabilirsiniz:

```dotenv
SMTP_FROM=you@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=you@example.com
SMTP_PASSWORD=GMAIL_UYGULAMA_SIFRESI
SMTP_STARTTLS=true
SMTP_SSL=false
# SMTP_FROM ile aynı değilse mevcut bir realm kullanıcısının adresi:
# SMTP_TEST_EMAIL=you@example.com
```

```powershell
node scripts/configure-identity.mjs smtp .env.identity.staging
node scripts/configure-identity.mjs smtp-test .env.identity.staging
```

İlk komut TLS'siz sunucu yapılandırmasını reddeder ve secret'ı ekrana yazmadan kaydedilen host/port/TLS ayarlarını yeniden okur. İkinci komut `SMTP_TEST_EMAIL`, yoksa `SMTP_FROM` adresindeki mevcut realm kullanıcısına uygulamanın gerçek doğrulama akışıyla e-posta gönderir. Test mesajı ulaşmadan Verify email'i açmayın; staging import'unda zaten açıksa yeni kullanıcıların giriş yapabilmesi için SMTP kurulumu zorunludur. Ardından gerçek bir kayıt doğrulaması ve **Forgot password** ile parola sıfırlama mesajını deneyin.

Diğer sağlayıcılarda kendi SMTP değerlerini ve TLS talimatlarını kullanın. Gönderen domaini doğrulama/SPF/DKIM gerekiyorsa sağlayıcının panelinde tamamlayın. Google OAuth client secret ile SMTP uygulama şifresi farklı değerlerdir. [Keycloak e-posta ayarları](https://www.keycloak.org/docs/latest/server_admin/)

## 7. Google Cloud'dan Client ID ve Client secret alın

1. [Google Cloud Console](https://console.cloud.google.com/) adresini açın; bir proje seçin veya oluşturun.
2. **Google Auth Platform → Branding** ekranına gidin. Uygulama adı, destek e-postası ve geliştirici iletişim e-postasını doldurun. Domain/politika adresi istenirse sahibi olduğunuz gerçek domainleri ve mevcut politika sayfalarını kullanın.
3. **Audience** altında kişisel Google hesapları da giriş yapacaksa **External** seçin. İlk doğrulamada **Testing** durumunda kalın ve **Test users** bölümüne girişte kullanacağınız Google hesabını ekleyin.
4. **Data Access** ekranında temel kimlik kapsamlarını kullanın: `openid`, e-posta ve profil. Envanter girişi için Drive/Gmail API erişimi gerekmez.
5. **Clients → Create client → Web application** seçin; isim olarak `Inventory Staging` yazın.
6. **Authorized redirect URIs** alanına şunu ekleyin:

   ```text
   https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging/broker/google/endpoint
   ```

   Buraya `/auth/callback` yazmayın. Google'ın dönüş noktası Keycloak'tır. JavaScript origins, Keycloak'ın sunucu üzerinden broker akışı için gerekli değildir; popup/Google JavaScript SDK entegrasyonu yapılmıyor.
7. **Create** ile oluşturun; çıkan **Client ID** ve **Client secret** değerlerini alın. Secret yalnızca oluşturma sırasında gösterilebileceğinden güvenli biçimde saklayın.
8. Bilgisayarınızdaki `.env.identity.staging` dosyasında:

   ```dotenv
   GOOGLE_CLIENT_ID=GOOGLE_PANELINDEN_ALDIGIM_CLIENT_ID
   GOOGLE_CLIENT_SECRET=GOOGLE_PANELINDEN_ALDIGIM_CLIENT_SECRET
   ```

Google callback tam eşleşmelidir; fazladan `/` bile uyuşmazlık yaratır. [Google OAuth istemci rehberi](https://developers.google.com/identity/protocols/oauth2/web-server)

## 8. Google bilgilerini Keycloak'a aktarın

Repo kökünde çalıştırın; Node.js 24 gerekir:

```powershell
node scripts/configure-identity.mjs google .env.identity.staging
```

Script HTTPS üzerinden Keycloak'a giriş yapar ve sadece `inventory-staging` realm'indeki `google` sağlayıcısını oluşturur/günceller. Secret değerlerini terminale yazdırmaz. Hedef realm ve Keycloak sunucusu önceden hazır olmalıdır.

Admin panelinden **Identity providers → google** ekranını kontrol edin:

- Enabled: **On**, alias: **google**.
- Client ID/secret doğru istemcinin değerleri olmalı.
- Trust Email: **Off**.
- First login flow: **first broker login**.
- Store tokens: **Off**.

Aynı e-postaya sahip yerel hesabı Google hesabına sessizce bağlamayın. Mevcut hesabın sahibi, Keycloak'ın hesap bağlama akışında o hesabı doğrulamalıdır. İlgili yeniden giriş/e-posta doğrulama adımlarını devre dışı bırakmayın.

İsterseniz script yerine bu sağlayıcıyı admin panelinden elle ekleyebilirsiniz; aynı ayarları kullanın. Client secret yalnızca Keycloak'ta kalır; business API'ye Google token'ı gönderilmez.

## 9. Uygulamanın staging ortamını etkinleştirin

Sunucuda mevcut `/opt/inventory-management/.env.staging` dosyasını açın. DATABASE_CONNECTION_STRING ve mevcut image/repository ayarlarını koruyun; aşağıdaki satırları ekleyin/güncelleyin:

```dotenv
KEYCLOAK_URL=https://staging-inventory-yamanemirhan.duckdns.org/identity
KEYCLOAK_AUTHORITY=https://staging-inventory-yamanemirhan.duckdns.org/identity/realms/inventory-staging
GOOGLE_LOGIN_ENABLED=true
```

```sh
sudo chmod 600 /opt/inventory-management/.env.staging
```

`KEYCLOAK_REALM=inventory-staging` ve `KEYCLOAK_CLIENT_ID=inventory-web` compose tarafından verilir. Bu dosyaya Google secret, SMTP şifresi veya Keycloak yönetici şifresi eklemeyin.

Identity discovery ve SMTP testi başarılı olduktan sonra kendi commit'inizi oluşturup **develop** dalına push edin. Mevcut workflow staging'e dağıtır. Sunucudaki kimlik dosyaları uygulama repo dizininin dışında kaldığı için deploy temiz checkout kontrolü korunur. Sadece bu ortam değişkenlerini sonradan değiştirdiyseniz mevcut uygulama dizininde mevcut image ayarlarıyla frontend/API container'larını yeniden oluşturun; değişkenler container restart ile kendiliğinden yenilenmez.

GitHub repo **Settings → Secrets and variables → Actions** alanındaki mevcut Azure OIDC, SSH ve sunucu secret'larını koruyun. Google ve SMTP secret'larının GitHub'a eklenmesi bu akışta gerekmez; kurulum Keycloak üzerinde yapılır. `main` production'a dağıtır, staging için kullanılmaz.

## 10. Local ve production karşılıkları

Local Google için ayrı Web application istemcisi oluşturun:

```text
http://localhost:8088/realms/inventory-development/broker/google/endpoint
```

ID/secret'ı `.env.identity` içine yazın; `node scripts/configure-identity.mjs google .env.identity` çalıştırın. `InventoryManagement.Web/.env.local` dosyasına `GOOGLE_LOGIN_ENABLED=true` yazın ve `npm run dev` işlemini yeniden başlatın. Diğer local değerler frontend `.env.example` içinde hazırdır. Normal e-posta/şifre girişi Google ayarlarından bağımsız çalışır.

Production için aynı sıralamayı, şu değişikliklerle ayrı olarak uygulayın:

- Şablon `deploy/keycloak/production.env.example`, özel dosya `.env.identity.production`.
- Realm `inventory-production`, port **8180**, ayrı `/opt/inventory-identity/production` dizini.
- KEYCLOAK_URL `https://inventory-yamanemirhan.duckdns.org/identity`.
- Google callback `https://inventory-yamanemirhan.duckdns.org/identity/realms/inventory-production/broker/google/endpoint`.
- Uygulama env dosyası `/opt/inventory-management/.env.production`.
- Nginx production SSL bloğunda proxy portu **8180**.
- Ayrı Google istemcisi, yönetici ve DB şifreleri; production için uygun Google Audience yayın durumunu kontrol edin.

Production'a geçmeden önce staging'de e-posta kaydı, e-posta doğrulama, şifreyle giriş, Google girişi, mevcut e-postayla hesap bağlama, logout ve User/Admin erişimini deneyin. Yeni token alınana kadar rol değişikliği mevcut kısa ömürlü access token'a yansımayabilir.

## 11. Git'e hangi dosyalar gidecek?

**Commit edilir:** uygulama kaynakları, compose/Nginx şablonları, `*.env.example`, README ve bu genel kurulum kılavuzu.

**Commit edilmez:** doldurulmuş `.env*` / `*.env` dosyaları, `.local/` üretimleri, özel anahtarlar, veritabanı dump'ları, log'lar ve yerel AI notları. `.gitignore` daha önce takip edilmiş bir dosyayı otomatik çıkarmaz. Commit öncesi `git status --short` ve `git diff --cached` ile seçiminizi kontrol edin; ignore kurallarını `git add -f` ile aşmayın.

Sır taraması bir güvenlik garantisi değildir. Bir secret geçmişte yayınlandıysa önce sağlayıcıda iptal edin/değiştirin; güncel dosyadan silmek eski commit'i temizlemez. Bu kurulum dosyaları gerçek credential içermez.
