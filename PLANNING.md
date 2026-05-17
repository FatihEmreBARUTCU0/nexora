# Nexora — Proje Planı

## Genel Bakış
Tam kapsamlı e-ticaret sitesi. Next.js 14 App Router, MongoDB, NextAuth, Cloudinary, iyzico ve Groq AI entegrasyonu.

---

## Faz 1 — Temel Altyapı (2-3 gün)

### 1.1 Proje Kurulumu
```bash
npx create-next-app@latest nexora --typescript --tailwind --eslint --app --src-dir=false
cd nexora
npm install mongoose next-auth@beta cloudinary iyzipay groq-sdk
npm install -D @types/node
```

### 1.2 MongoDB Bağlantısı (`lib/db.ts`)
Singleton pattern — Vercel serverless'ta bağlantı sızıntısı önler.
```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise = cached.promise || mongoose.connect(MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### 1.3 NextAuth Kurulumu
- Providers: Credentials (email/şifre) + Google (opsiyonel)
- Session'a role alanı ekle (user | admin)
- middleware.ts ile /admin/* ve /orders/* rotalarını koru

### 1.4 Mongoose Modelleri

**Product**
```
name, slug (unique), description, price, comparePrice,
images: [{ url, publicId }],
category, brand, stock, sold,
variants: [{ name, value, stock }],
ratings: { avg, count },
isActive, timestamps
```

**User**
```
name, email, password (hashed), role (user|admin),
addresses: [{ title, city, district, fullAddress, isDefault }],
timestamps
```

**Order**
```
user (ref), items: [{ product, name, price, qty, image }],
shippingAddress, paymentMethod, paymentId,
status (pending|paid|shipped|delivered|cancelled),
subtotal, shipping, total, timestamps
```

**Category**
```
name, slug, image, parent (ref, self), isActive
```

---

## Faz 2 — Ürün ve Kullanıcı Sistemi (4-5 gün)

### 2.1 Ürün Sayfaları
- `/products` — Listeleme, filtreleme (kategori, fiyat, marka), sıralama, sayfalama
- `/products/[slug]` — Detay: galeri, varyant seçimi, stok durumu, "Sepete ekle"

### 2.2 Cloudinary Görsel Yükleme
```ts
// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({ ... });
export const uploadImage = async (file: string) =>
  cloudinary.uploader.upload(file, { folder: "nexora/products" });
```

### 2.3 Kullanıcı Sayfaları
- Kayıt / Giriş
- Profil (bilgi güncelleme, adres yönetimi)
- `/orders` — Sipariş geçmişi ve takip

---

## Faz 3 — Sepet, Sipariş ve Ödeme (4-5 gün)

### 3.1 Sepet Sistemi
- `context/CartContext.tsx` — Client-side state (Context API + localStorage sync)
- Giriş yapınca DB'ye sync et
- Ürün adedi, toplam fiyat, stok kontrolü

### 3.2 Checkout Akışı
1. Adres seçimi / yeni adres
2. Ödeme yöntemi (kredi kartı)
3. Sipariş özeti
4. iyzico ödeme formu
5. Başarı / hata sayfası

### 3.3 iyzico Entegrasyonu
```ts
// lib/iyzico.ts
const Iyzipay = require("iyzipay");
export const iyzico = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL,
});
```
- Sandbox test kartı: 5528790000000008, CVV: 123, SKT: 12/30

### 3.4 Webhook
`/api/webhook/iyzico/route.ts` — Ödeme başarılı olunca sipariş status'u "paid" yap, stok düş, email gönder.

---

## Faz 4 — Admin Paneli (3-4 gün)

### 4.1 Dashboard
- Toplam satış (bugün / bu ay / toplam)
- Bekleyen sipariş sayısı
- Az kalan stok uyarısı
- Son 10 sipariş listesi

### 4.2 Ürün Yönetimi
- Ürün listesi (arama, filtre, sayfalama)
- Ürün ekle / düzenle (çoklu görsel yükleme, varyant yönetimi)
- Ürün sil / pasife al

### 4.3 Sipariş Yönetimi
- Sipariş listesi (durum filtrelemeli)
- Sipariş detayı ve durum güncelleme
- Kargo takip numarası ekleme

---

## Faz 5 — AI Özellikleri (2-3 gün)

### 5.1 Kişiselleştirilmiş Ürün Önerisi
**Endpoint:** `POST /api/ai/recommend`
**Nasıl çalışır:**
- Kullanıcının sipariş geçmişi + incelediği ürünler context olarak Groq'a gönderilir
- Groq, veritabanındaki ürünlerle eşleştirme yapar
- Ana sayfa ve ürün detay sayfasında "Senin için öneriler" widget'ı gösterilir

**Prompt örneği:**
```
Sen bir e-ticaret öneri sistemisin.
Kullanıcının geçmiş siparişleri: {siparisler}
Mevcut ürün kataloğu: {urunler}
Bu kullanıcıya en uygun 4 ürünü JSON formatında öner.
Yanıt formatı: [{ "productId": "...", "reason": "..." }]
```

### 5.2 Doğal Dil ile Ürün Arama
**Endpoint:** `POST /api/ai/search`
**Nasıl çalışır:**
- Kullanıcı "kırmızı 500 TL altı bluetooth kulaklık" yazar
- Groq, bu metni MongoDB sorgu parametrelerine dönüştürür
- Normal arama yerine AI destekli semantik arama yapılır

**Prompt:**
```
Kullanıcı şunu arıyor: "{sorgu}"
Bunu şu JSON formatına çevir:
{ "keywords": "", "maxPrice": null, "minPrice": null, "category": "", "brand": "" }
Sadece JSON döndür, başka bir şey yazma.
```

### 5.3 Müşteri Destek Chatbot
**Endpoint:** `POST /api/ai/chat` (streaming)
**Nasıl çalışır:**
- Sağ altta floating chat widget
- Groq'a sistem prompt olarak: sipariş durumu, iade politikası, kargo bilgisi verilir
- Kullanıcı giriş yapmışsa aktif siparişleri de context'e eklenir
- ReadableStream ile streaming yanıt

**Sistem prompt:**
```
Sen Nexora'nın müşteri destek asistanısın.
Şirket politikaları: 14 gün iade, ücretsiz kargo 500 TL üzeri.
Kullanıcının aktif siparişleri: {siparisler}
Nazik ve kısa yanıtlar ver. Bilmediğin şeyleri uydurma.
```

### 5.4 Akıllı Sepet / Upsell Önerisi
**Endpoint:** `POST /api/ai/upsell`
**Nasıl çalışır:**
- Sepet sayfasında "Bunları da beğenebilirsin" bölümü
- Sepetteki ürünler + katalog Groq'a gönderilir
- "Bu ürünlerle iyi gider" mantığıyla 2-3 ürün önerir

---

## Kurulum Sırası

```bash
# 1. Projeyi oluştur
npx create-next-app@latest nexora --typescript --tailwind --eslint --app

# 2. Paketleri yükle
npm install mongoose next-auth@beta cloudinary iyzipay groq-sdk
npm install @radix-ui/react-dialog @radix-ui/react-select lucide-react
npm install react-hot-toast react-hook-form zod @hookform/resolvers

# 3. .env.local oluştur (yukarıdaki değişkenler)

# 4. lib/db.ts yaz

# 5. models/ oluştur

# 6. NextAuth kur

# 7. Sayfalara geç
```

---

## Deploy Checklist

- [ ] MongoDB Atlas IP whitelist: 0.0.0.0/0 (Vercel için)
- [ ] Vercel'de tüm env variable'lar tanımlandı
- [ ] iyzico sandbox → production anahtarları değiştirildi
- [ ] Cloudinary unsigned upload preset kapatıldı
- [ ] NEXTAUTH_URL production URL'e güncellendi
- [ ] next.config.js'de Cloudinary domain'i tanımlandı

---

## Performans & SEO

- Ürün sayfaları: generateMetadata ile dynamic SEO
- Görsel optimizasyonu: next/image + Cloudinary transformations
- ISR (Incremental Static Regeneration): Ürün sayfaları için revalidate: 60
- Loading UI: Her sayfa için loading.tsx
- Error UI: Her sayfa için error.tsx
