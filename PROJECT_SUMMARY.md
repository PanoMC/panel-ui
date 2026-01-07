# Pano Project Overview

## 🎯 Proje Tanımı

**Pano**, Minecraft için geliştirilmiş ileri seviye bir web platformudur. Geleneksel web scriptlerden farklı olarak,
tek bir JAR dosyası ile çalıştırılabilen, CMS benzeri özelliklere sahip kapsamlı bir platformdur.

---

## 🏗️ Teknik Mimari

### Backend

- **Dil:** Kotlin

- **Framework:** Vert.x

- **Dependency Injection:** Spring DI

- **Runtime:** JVM 11+

- **Database:** MySQL 5.5+ / MariaDB

### Frontend

- **Framework:** SvelteKit

- **UI Framework:** Bootstrap 5

- **Runtime & Package Manager:** Bun

- **Style:** SASS desteği

- **Dil:** JavaScript (TypeScript kullanılmıyor)

### Mimari Özellikler

- **SSR (Server-Side Rendering):** SEO odaklı

- **Microservices:** Her arayüz ayrı portta çalışır

- **Reverse Proxy:** Backend gerekli arayüze otomatik yönlendirme yapar

- **Build:** Tek .jar dosyası olarak dağıtılır (Paper, Spigot, Bungeecord benzeri)

- **İletişim:** WebSocket protokolü (MC Plugin ↔ Backend)

- **Güvenlik:** End-to-end encryption (RSA + AES-256 hybrid)

- **Multi-Server:** Birden fazla Minecraft sunucusu bağlantısı

---

## 📦 Dağıtım ve Build Süreci

### Deployment Yapısı

1. Her UI projesi ayrı ayrı `.zip` olarak build edilir

2. ZIP dosyaları GitHub'dan indirilip JAR içine eklenir

3. Pano ayağa kalkarken:

&nbsp; - UI ZIP dosyalarını extract eder

&nbsp; - Platforma özgü Bun portable runtime'ı indirir (örn: ARM 64-bit)

&nbsp; - Config.conf dosyası oluşturur

&nbsp; - `plugins/` klasörü oluşturur

&nbsp; - `themes/` klasörü oluşturur

### CI/CD

- **Platform:** GitHub Actions

- **Release:** Tüm projeler GitHub Releases'e otomatik publish edilir

---

## 🔄 Release Döngüsü

| Release Türü | Branch | Stabilite | Açıklama |

|-------------|--------|-----------|-----------|

| **Alpha** | `alpha` | Düşük | Aktif geliştirme, sık güncellemeler, breaking changes olabilir |

| **Beta** | `beta` | Orta | Pre-release, daha stabil |

| **Release** | `main` | Yüksek | Production-ready, en stabil versiyon |

---

## 📁 Proje Yapısı

### 1. **panel-ui**

- Pano'nun yönetim arayüzü

- SvelteKit + Bootstrap 5

- Build: ZIP dosyası

### 2. **setup-ui**

- İlk kurulum arayüzü

- Sadece ilk başta görünür, kurulum sonrası devre dışı kalır

- SvelteKit + Bootstrap 5

- Build: ZIP dosyası

### 3. **vanilla-theme**

- Default tema

- Tüm temaların base'i

- **Önemli:** Tüm temalar vanilla-theme fork'u olmak zorunda

- Build: ZIP dosyası

### 4. **pano-mc-plugin**

- Minecraft sunucu entegrasyonu

- **Desteklenen Platformlar:**

&nbsp;- Spigot

&nbsp;- Paper

&nbsp;- Folia

&nbsp;- Bungeecord

&nbsp;- Velocity

&nbsp;- Core (sadece API JAR'ı)

- **Plugin Entegrasyonları:**

&nbsp;- AuthMeReloaded

&nbsp;- Diğer auth pluginleri

&nbsp;- Ban pluginleri

&nbsp;- Permission pluginleri

- **Bağlantı:**

&nbsp;- Birden fazla Minecraft sunucusu Pano'ya bağlanabilir

&nbsp;- WebSocket üzerinden iletişim

&nbsp;- End-to-end encrypted

- **Build:** Her platform için ayrı JAR dosyası

- **Dağıtım:** GitHub Releases

### 5. **website** (Kapalı Kaynak)

- Pano'nun resmi web sitesi

- **Özellikler:**

&nbsp;- Marketplace (resource pazarı)

&nbsp;- Üyelik sistemi

&nbsp;- Tema ve addon paylaşım sistemi

- **Deployment:** Cloudflare (Serverless, SSR destekli)

- **URL:**

&nbsp;- Dev: `https://dev.panomc.com` (şu anki aktif)

&nbsp;- Production: `https://panomc.com` (yakında)

- `/docs` altında documentation barındırır

### 6. **website-backend** (Kapalı Kaynak)

- Website'in backend servisi

- **Framework:** Parsek (Kotlin + Vert.x)

- **Deployment:** Coolify (VPS üzerinde)

- **CI/CD:** Otomatik deployment

### 7. **docs**

- Proje dokümantasyonu

- **Framework:** VitePress

- **Dil:** JavaScript

- **Build:** Website projesi tarafından indirilip `/docs` altına yerleştirilir

---

## 🔒 Güvenlik ve İletişim

### WebSocket Bağlantısı (MC Plugin ↔ Pano Backend)

Pano ile Minecraft sunucuları arasındaki iletişim WebSocket protokolü üzerinden gerçekleşir ve end-to-end şifreleme
kullanır.

#### Encryption Mekanizması (Hybrid Encryption: RSA + AES)

**Bağlantı Kurulum Adımları:**

1. **RSA Key Pair Oluşturma (Plugin)**

&nbsp; - Plugin sunucuda bir RSA key pair oluşturur

&nbsp; - Public key base64 encoded şekilde Pano backend'e gönderilir

2. **AES Key Oluşturma (Backend)**

&nbsp; - Pano backend 256-bit AES key oluşturur

&nbsp; - AES key, plugin'den gelen RSA public key ile encrypt edilir

&nbsp; - Encrypted AES key, base64 encoded şekilde plugin'e geri gönderilir

3. **AES Key Decrypt (Plugin)**

&nbsp; - Plugin, RSA private key'i kullanarak encrypted AES key'i decrypt eder

&nbsp; - AES key'i güvenli şekilde saklar

4. **Mesajlaşma**

&nbsp; - Her mesaj gönderiminde her iki taraf da kaydedilmiş AES key'i kullanır

&nbsp; - Tüm mesajlar AES-256 ile encrypt/decrypt edilir

&nbsp; - End-to-end encryption sağlanmış olur

**Güvenlik Özellikleri:**

- ✅ RSA public-key cryptography (key exchange için)

- ✅ AES-256 symmetric encryption (mesajlaşma için)

- ✅ Base64 encoding

- ✅ End-to-end encryption

- ✅ Her bağlantı için unique AES key

---

## 🔌 Eklenti Sistemi

### Addon Sistemi

- **Backend:** Plugin olarak geçer

- **Frontend:** Addon olarak geçer

- **Yetenekler:**

&nbsp;- Seçili temaya özellik ekleme

&nbsp;- Panel'e özellik ekleme

&nbsp;- Mevcut özellikleri değiştirme

&nbsp;- Özellikleri kaldırma

### Tema Sistemi

- Vanilla-theme tabanlı

- Özelleştirilebilir

- Addon desteği

---

## 🏛️ Resmi Eklentiler

Pano ekibi tarafından geliştirilen ve desteklenen resmi eklentiler:

- **pano-plugin-announcement:** Duyuru yönetimi eklentisi. Panel üzerinden duyurular oluşturmanıza ve yönetmenize olanak tanır.

---

## 🛠️ UI Eklenti Geliştirme (Hızlı Yöntem)

UI tarafında eklenti geliştirirken hızlıca test etmek için aşağıdaki adımları izleyebilirsiniz:

1.  Eklenti dosyalarınızı doğrudan `plugins/` klasörü altına yerleştirin.
2.  `bun dev` komutunu çalıştırarak geliştirme sunucusunu başlatın.
3.  Sayfayı yenileyerek değişiklikleri anında görebilirsiniz.

> [!IMPORTANT]
> Geliştirdiğiniz UI eklentisinin çalışabilmesi için **Panel -> Ayarlar -> Dev Mode** seçeneğinin aktif olması gerekmektedir.

---

## 🛠️ Pano SDK

Pano ekosistemi için geliştirilen resmi SDK:

- **Paket Adı:** `@panomc/sdk` (npm üzerinden erişilebilir)
- **Versiyonlar:**
  - `master`: Stabil (production-ready) versiyon.
  - `dev`: En güncel, geliştirme aşamasındaki versiyon.
- **Amacı:** Host (Pano) ile pluginler arasında bir köprü görevi görür. Eklentilere API erişimi ve hazır component'ler (Component Provider) sağlar.
- **Entegrasyon Yapısı:**
  - **Development (UI):** `panel-ui`, `vanilla-theme` ve `setup-ui` gibi projelerde SDK, `src/pano-sdk` dizini altında bir **Git Submodule** olarak eklenmiştir ve projeyle birlikte derlenir. Bu projeler SDK'yı bir **Host** olarak kullanır.
  - **Production (Plugin):** Eklentiler SDK'yı bir **Client** gibi kullanır; npm paketi (`@panomc/sdk`) üzerinden projeye dahil edilir.

---

## 👥 Takım Yapısı

| Rol | Sorumluluklar |

|-----|---------------|

| **Lead Developer** | Backend + Frontend geliştirme |

| **Designer & UI Coder** | Tasarım, Bootstrap SASS, CSS |

**Toplam:** 2 kişi

---

## 🛠️ Geliştirme Standartları

### Frontend

- ✅ JavaScript (tercih edilen)

- ❌ TypeScript (kullanılmıyor)

- ✅ SASS/SCSS desteği

- ✅ SvelteKit

- ✅ Bootstrap 5

### Backend

- ✅ Kotlin

- ✅ Vert.x

- ✅ Spring DI

- ✅ JVM 11+

### Database

- ✅ MySQL 5.5+

- ✅ MariaDB

---

## 🌐 Resource Terminolojisi

**Resource:** Tema ve addonların genel ve ortak ismi

- Temalar = Resource

- Addonlar = Resource

Website üzerinde "resource" paylaşımı bu iki türü kapsar.

---

## 📝 Notlar

1. Pano, geleneksel web scriptler gibi kurulmaz - tek JAR dosyası ile çalışır

2. Her arayüz farklı portlarda çalışır, backend reverse proxy yapar

3. Tüm UI projeleri Bun runtime kullanır

4. SEO odaklı tasarım (SSR sayesinde)

5. Platform bağımsız Bun runtime otomatik indirilir

6. GitHub Actions ile tam otomatik CI/CD pipeline

7. Birden fazla Minecraft sunucusu aynı Pano instance'ına bağlanabilir

8. WebSocket iletişimi end-to-end encrypted (RSA + AES-256 hybrid encryption)

---

## 🔗 Kaynaklar

- **Production URL:** https://panomc.com (yakında)

- **Dev URL:** https://dev.panomc.com

- **Docs:** /docs endpoint üzerinden erişilebilir

- **Releases:** GitHub Releases sayfaları

---

_Son Güncelleme: 2025_
