# 🏟️ Görünmeyen Lig Anketi — Proje Planı

> **Son Güncelleme:** 26 Mayıs 2026  
> **Durum:** Planlama Tamamlandı → Implementasyon Aşaması

---

## 📋 İçindekiler

1. [Proje Özeti](#1-proje-özeti)
2. [Teknoloji Stack](#2-teknoloji-stack)
3. [Mimari](#3-mimari)
4. [Güvenlik Stratejisi](#4-güvenlik-stratejisi)
5. [Veritabanı Şeması](#5-veritabanı-şeması)
6. [Rol Sistemi (RBAC)](#6-rol-sistemi-rbac)
7. [API Akışları](#7-api-akışları)
8. [Dosya Yapısı](#8-dosya-yapısı)
9. [Ortam Değişkenleri](#9-ortam-değişkenleri)
10. [Deployment Stratejisi](#10-deployment-stratejisi)
11. [Free Tier Bütçe Analizi](#11-free-tier-bütçe-analizi)
12. [Implementasyon Sırası](#12-implementasyon-sırası)

---

## 1. Proje Özeti

| Alan | Detay |
|------|-------|
| **Proje Adı** | Görünmeyen Lig Anketi |
| **Tür** | Web Uygulaması (Spor Anketi Platformu) |
| **İndustri** | Spor Anketi Platformu |
| **Hedef Kitle** | Türk futbol taraftarları |
| **Dil** | Türkçe |
| **Temel Kural** | 1 Google Hesabı = 1 Oy (anket başına) |

### Proje Genel İçerik ve Temel Özellikler

**Kullanıcı Tarafı:**
- Google OAuth ile giriş yapma
- Yayınlanmış anketleri görüntüleme
- Anket doldurma (12+ soru tipi desteği)
- Her anketi yalnızca bir kez doldurabilme (1 hesap = 1 oy)
- Cevap verdikten sonra teşekkür mesajı görme
- İlerleme çubuğu ile anket tamamlama durumu

**Admin Paneli:**
- Dashboard (istatistikler, cevap sayıları)
- Soru yönetimi (ekleme / düzenleme / silme — inline)
- Drag-to-reorder bölümler ve sorular (@dnd-kit)
- 12+ soru tipi seçimi (short_text, long_text, single_choice, multiple_choice, dropdown, linear_scale, rating, yes_no, date, number, ranking, matrix)
- Opsiyonlar yönetimi (radio, checkbox, dropdown seçenekleri)
- Zorunlu/isteğe bağlı toggle
- Publish/Draft/Closed durum kontrolü
- Başlık ve açıklama düzenleme
- Bölüm ekleme/silme/yeniden sıralama
- Cevaplar tablosu (filtreleme, sıralama)
- CSV export
- Skala soruları için ortalama göstergesi
- Real-time cevap sayacı (saatlik polling)
- Kullanıcı yetki yönetimi (RBAC)
- Admin aktivite logu (audit trail)

**Güvenlik:**
- Bot koruması (Cloudflare Turnstile)
- Rate limiting (Upstash Redis)
- WAF (Cloudflare)
- SQL Injection koruması (Drizzle ORM)
- XSS koruması (DOMPurify)
- CSRF koruması
- Honeypot alanları
- Timing check
- IP whitelist (Render → sadece Cloudflare IP)
- Audit log
- 22 maddelik güvenlik kontrol listesi

### Kullanıcı Akışı

1. Kullanıcı siteye girer
2. Google hesabı ile giriş yapar
3. Yayınlanmış anket varsa görüntüler
4. Daha önce cevap vermediyse anketi doldurur
5. Başarı mesajı: **"Anket başarıyla tamamlandı. Katıldığınız için teşekkürler. Sonuçlar için takipte kalın."**
6. Aynı anketi tekrar dolduramaz (DB UNIQUE constraint)

---

## 2. Teknoloji Stack

### Frontend
| Teknoloji | Açıklama |
|-----------|----------|
| **React 19** | UI framework |
| **Vite** | Build tool |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI bileşen kütüphanesi |
| **@dnd-kit** | Drag & drop (soru/bölüm sıralama) |
| **React Router** | SPA routing |
| **Zustand** | State management |
| **SWR** | Data fetching + saatlik polling |
| **DOMPurify** | XSS sanitization |

### Backend
| Teknoloji | Açıklama |
|-----------|----------|
| **Hono.js** | Web framework (Node.js runtime) |
| **better-auth** | Google OAuth + session management |
| **Drizzle ORM** | Type-safe ORM |
| **Zod** | Runtime validation |
| **Neon Serverless Driver** | DB connection |

### Edge (BFF Proxy)
| Teknoloji | Açıklama |
|-----------|----------|
| **Cloudflare Workers** | Edge proxy (Hono.js) |
| **Cloudflare Turnstile** | Bot koruması |
| **Upstash Redis** | Rate limiting (Workers native) |

### Veritabanı
| Teknoloji | Açıklama |
|-----------|----------|
| **Neon Postgres** | Serverless PostgreSQL (Free Tier) |

### Deploy
| Servis | Açıklama |
|--------|----------|
| **Cloudflare Pages** | Frontend hosting |
| **Render** | Backend API hosting (Free Tier) |
| **Cloudflare DNS + WAF** | Trafik yönetimi + güvenlik |

### Monorepo
| Teknoloji | Açıklama |
|-----------|----------|
| **Turborepo** | Monorepo yönetimi |
| **pnpm** | Paket yöneticisi |

---

## 3. Mimari

```
┌──────────────────────────────────────────────────────────┐
│                       KULLANICI                          │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                 CLOUDFLARE (Edge)                        │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐              │
│  │ WAF      │  │ Turnstile │  │ Rate     │              │
│  │ Rules    │  │ (Bot)     │  │ Limit    │              │
│  └──────────┘  └───────────┘  └──────────┘              │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Cloudflare Pages (React SPA)               │ │
│  │  React + Vite + Tailwind + shadcn/ui + @dnd-kit    │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        ↓ API Calls                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Cloudflare Workers (BFF Proxy)             │ │
│  │  Hono.js — Turnstile verify, Rate limit, CORS      │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         ↓ (sadece Cloudflare IP'leri)
┌────────────────────────┼─────────────────────────────────┐
│                 RENDER (Backend API)                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Hono.js REST API (Node.js)                 │ │
│  │  better-auth + Drizzle ORM + Zod + RBAC            │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         ↓
┌────────────────────────┼─────────────────────────────────┐
│                 NEON POSTGRES (Free Tier)                │
│  Survey data + Users + Responses + Sessions + Audit     │
└──────────────────────────────────────────────────────────┘
```

### Neden Bu Mimari?
- **Render gizli:** Backend doğrudan internete açık değil, sadece Cloudflare Workers üzerinden erişilebilir
- **Triple firewall:** Cloudflare WAF → Workers validation → Hono middleware
- **Edge-first:** Bot koruması, rate limiting, Turnstile doğrulaması backend'e hiç ulaşmadan yapılır
- **Type-safe uçtan uca:** shared types package ile frontend ↔ worker ↔ backend tip uyumu

---

## 4. Güvenlik Stratejisi

### 4.1 Bot & Sabotaj Koruması

| Katman | Yöntem | Yeri | Detay |
|--------|--------|------|-------|
| 1 | Cloudflare WAF | Cloudflare | SQLi, XSS, known attack pattern'leri otomatik blok |
| 2 | Cloudflare DDoS | Cloudflare | Volumetrik saldırılara karşı otomatik koruma |
| 3 | Cloudflare Turnstile | Workers | Invisible mode — kullanıcı dostu bot doğrulama |
| 4 | Rate Limiting | Workers + Upstash | IP bazlı sliding window (örn: 10 req/dk) |
| 5 | Honeypot | Frontend | Gizli form alanları — bot doldurur → reddet |
| 6 | Timing Check | Render | Form açılış → gönderim süresi < 2sn = şüpheli |
| 7 | Request Size Limit | Workers | Body > 100KB = reddet |
| 8 | Browser Fingerprint | Frontend | Aynı cihazdan tekrar tespiti (hafif) |

### 4.2 Veritabanı Güvenliği

| Katman | Yöntem | Detay |
|--------|--------|-------|
| 1 | Drizzle ORM | Raw SQL yok, her sorgu parametrik |
| 2 | UNIQUE constraint | `responses(survey_id, user_id)` — DB seviyesinde 1 kişi = 1 oy |
| 3 | Parameterized queries | Drizzle tarafından otomatik |
| 4 | Connection pooling | Neon proxy üzerinden, direct connection kapalı |
| 5 | Environment variables | Hiçbir secret koda hardcoded değil |
| 6 | Neon branching | Canlı veriden branch al, test et, geri dön |
| 7 | RLS (opsiyonel) | Row Level Security policies |

### 4.3 Uygulama Güvenliği

| Katman | Yöntem | Detay |
|--------|--------|-------|
| 1 | Zod validation | Her API input'u runtime validasyondan geçer |
| 2 | RBAC middleware | Rol bazlı erişim kontrolü (admin/editor/viewer) |
| 3 | CSRF protection | better-auth dahili CSRF koruması |
| 4 | XSS sanitization | DOMPurify ile kullanıcı girdisi temizlenir |
| 5 | CORS enforcement | Workers'da strict CORS — sadece frontend domain'i |
| 6 | Security headers | Helmet.js — X-Frame-Options, CSP, X-Content-Type-Options |
| 7 | Input sanitization | HTML tag'leri strip, SQL özel karakterleri escape |
| 8 | Audit log | Tüm admin işlemleri `admin_activity_log` tablosuna kaydedilir |

### 4.4 Ağ Güvenliği

| Katman | Yöntem | Detay |
|--------|--------|-------|
| 1 | HTTPS only | Tüm iletişim şifreli |
| 2 | Cloudflare proxy | Origin server IP'si gizli |
| 3 | Render IP whitelist | Sadece Cloudflare IP'lerinden gelen istekler kabul edilir |
| 4 | Cloudflare WAF rules | Custom rules: ülke filtresi, bot score, vs. |

### Tam Güvenlik Kontrol Listesi (22 Maddelik)

| # | Katman | Koruma | Uygulama Yeri |
|---|--------|--------|---------------|
| 1 | Edge | Cloudflare WAF | Cloudflare |
| 2 | Edge | DDoS koruması | Cloudflare |
| 3 | Edge | Turnstile (bot) | Workers |
| 4 | Edge | Rate limiting | Workers + Upstash |
| 5 | Edge | CORS enforcement | Workers |
| 6 | Edge | Security headers | Workers |
| 7 | Edge | Request size limit | Workers |
| 8 | Network | IP whitelist (sadece CF IP) | Render |
| 9 | Network | HTTPS only | Her yer |
| 10 | App | Zod validation | Render |
| 11 | App | Auth (Google OAuth) | Render |
| 12 | App | RBAC middleware | Render |
| 13 | App | SQL Injection (Drizzle ORM) | Render |
| 14 | App | XSS (DOMPurify) | Frontend |
| 15 | App | CSRF token | Render |
| 16 | App | Honeypot fields | Frontend |
| 17 | App | Timing check (min form time) | Render |
| 18 | Data | UNIQUE constraint (1 user = 1 vote) | Neon |
| 19 | Data | RLS policies (opsiyonel) | Neon |
| 20 | Data | Audit log | Neon |
| 21 | Data | Parameterized queries | Drizzle |
| 22 | Data | Input sanitization | Render |

---

## 5. Veritabanı Şeması

### 5.1 Tablolar

#### `users`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| google_id | VARCHAR(255) | NOT NULL, UNIQUE |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| name | VARCHAR(255) | |
| avatar_url | VARCHAR(500) | |
| role | ENUM | DEFAULT 'user' |
| is_admin | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| last_login | TIMESTAMP | |

#### `surveys`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| status | ENUM | DEFAULT 'draft' |
| created_by | UUID | FK → users.id, CASCADE |
| published_at | TIMESTAMP | |
| closes_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### `survey_assignments`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| survey_id | UUID | FK → surveys.id, CASCADE |
| user_id | UUID | FK → users.id, CASCADE |
| role | ENUM('editor','viewer') | NOT NULL |
| can_edit | BOOLEAN | DEFAULT FALSE |
| can_view | BOOLEAN | DEFAULT TRUE |
| can_export | BOOLEAN | DEFAULT FALSE |
| assigned_by | UUID | FK → users.id, CASCADE |
| assigned_at | TIMESTAMP | DEFAULT NOW() |
| **UNIQUE** | | (survey_id, user_id) |

#### `sections`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| survey_id | UUID | FK → surveys.id, CASCADE |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| order_index | INTEGER | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### `questions`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| section_id | UUID | FK → sections.id, CASCADE |
| question_type | ENUM(12 tip) | NOT NULL |
| title | VARCHAR(500) | NOT NULL |
| description | TEXT | |
| is_required | BOOLEAN | DEFAULT TRUE |
| order_index | INTEGER | NOT NULL |
| scale_min | INTEGER | |
| scale_max | INTEGER | |
| scale_min_label | VARCHAR(50) | |
| scale_max_label | VARCHAR(50) | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Soru Tipleri:** short_text, long_text, single_choice, multiple_choice, dropdown, linear_scale, rating, yes_no, date, number, ranking, matrix

#### `question_options`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| question_id | UUID | FK → questions.id, CASCADE |
| label | VARCHAR(200) | NOT NULL |
| order_index | INTEGER | NOT NULL |
| is_other | BOOLEAN | DEFAULT FALSE |

#### `responses`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| survey_id | UUID | FK → surveys.id, CASCADE |
| user_id | UUID | FK → users.id, CASCADE |
| submitted_at | TIMESTAMP | DEFAULT NOW() |
| ip_address | VARCHAR(45) | |
| user_agent | VARCHAR(500) | |
| turnstile_token | VARCHAR(500) | |
| **UNIQUE** | | (survey_id, user_id) ← 1 anket = 1 cevap |

#### `answer_values`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| response_id | UUID | FK → responses.id, CASCADE |
| question_id | UUID | FK → questions.id, CASCADE |
| option_id | UUID | FK → question_options.id, SET NULL |
| text_value | TEXT | |
| number_value | INTEGER | |
| rank_value | INTEGER | |
| is_other_text | BOOLEAN | DEFAULT FALSE |

#### `admin_activity_log`
| Kolon | Tip | Kısıtlar |
|-------|-----|----------|
| id | UUID | PK, defaultRandom() |
| user_id | UUID | FK → users.id, CASCADE |
| action | VARCHAR(100) | NOT NULL |
| target_type | VARCHAR(50) | NOT NULL |
| target_id | UUID | |
| details | JSONB | |
| ip_address | VARCHAR(45) | |
| created_at | TIMESTAMP | DEFAULT NOW() |

### 5.2 İlişki Haritası

```
users ──1:N──→ survey_assignments ←──N:1── surveys
users ──1:N──→ responses
users ──1:N──→ admin_activity_log

surveys ──1:N──→ sections ──1:N──→ questions ──1:N──→ question_options
surveys ──1:N──→ responses ──1:N──→ answer_values
surveys ──1:N──→ survey_assignments

questions ←──N:1── answer_values ──N:1──→ question_options
```

---

## 6. Rol Sistemi (RBAC)

### 6.1 Roller ve Yetkiler

| Yetki | ADMIN | EDİTÖR | GÖZLEMCİ | KULLANICI |
|-------|-------|--------|----------|-----------|
| Tüm anketleri yönet | ✅ | ❌ | ❌ | ❌ |
| Atanan ankette soru/bölüm düzenle | ✅ | ✅ | ❌ | ❌ |
| Atanan anketi görüntüle | ✅ | ✅ | ✅ | ❌ |
| Cevapları görüntüle | ✅ | ✅ | ✅ | ❌ |
| CSV export | ✅ | ❌ | ✅ | ❌ |
| Anket publish/draft | ✅ | ❌ | ❌ | ❌ |
| Kullanıcıya yetki ata | ✅ | ❌ | ❌ | ❌ |
| Anket oluştur | ✅ | ❌ | ❌ | ❌ |
| Anket sil | ✅ | ❌ | ❌ | ❌ |
| Anket doldur | — | ✅ | ✅ | ✅ |

### 6.2 Admin Tanımlama
- Environment variable `ADMIN_EMAIL` ile tanımlı Google email = super-admin
- `is_admin` alanı users tablosunda — ilk girişte `ADMIN_EMAIL` ile eşleşirse otomatik true
- Admin, diğer kullanıcılara anket bazlı + yetki bazlı rol atayabilir

### 6.3 Granüler Yetki Atama (survey_assignments)
- `can_edit`: Soru/bölüm düzenleme izni
- `can_view`: Cevapları görüntüleme izni
- `can_export`: CSV export izni
- Admin, her kullanıcı için anket bazlı bu 3 yetkiyi bağımsız verebilir

---

## 7. API Akışları

### 7.1 Kullanıcı — Anket Doldurma

```
1. Kullanıcı /survey/{id} sayfasını açar
2. Cloudflare Pages → SPA render
3. Frontend → GET /api/surveys/:id (Workers proxy → Render)
4. Kullanıcı Google ile giriş yapar → better-auth callback
5. Frontend → GET /api/surveys/:id/my-response (daha önce cevap verdi mi?)
   ├── VERDİ → "Zaten katıldınız" mesajı
   └── VERMEDİ → SurveyForm render
6. Kullanıcı form doldurur → POST /api/surveys/:id/responses
   ├── Workers: Turnstile verify + Rate limit check
   ├── Render: Auth verify + Duplicate check (DB UNIQUE) + Zod validate
   └── Başarılı → "Anket başarıyla tamamlandı. Katıldığınız için teşekkürler. Sonuçlar için takipte kalın."
```

### 7.2 Admin — Soru Yönetimi

```
1. Admin giriş yapar → better-auth → role=admin kontrolü
2. GET /api/admin/surveys → anket listesi
3. GET /api/admin/surveys/:id → sorular + bölümler
4. Drag-reorder → PUT /api/admin/surveys/:id/sections/reorder
   ├── Transaction içinde tüm orderIndex'ler güncellenir
   └── Activity log yazılır
5. Soru ekle → POST /api/admin/surveys/:id/questions
6. Soru düzenle → PATCH /api/admin/questions/:id
7. Soru sil → DELETE /api/admin/questions/:id
```

### 7.3 API Endpoint Listesi

#### Auth
```
GET    /api/auth/google          → Google OAuth redirect
GET    /api/auth/google/callback → OAuth callback
POST   /api/auth/logout          → Çıkış yap
GET    /api/auth/me              → Mevcut kullanıcı bilgisi
GET    /api/auth/session          → Session bilgisi
```

#### Surveys (Public)
```
GET    /api/surveys               → Açık anket listesi
GET    /api/surveys/:id           → Anket detayı (soru/opsiyonlar)
GET    /api/surveys/:id/my-response → Kullanıcının cevabı var mı?
POST   /api/surveys/:id/responses  → Cevap gönder
```

#### Admin
```
GET    /api/admin/surveys                → Tüm anketler (draft dahil)
POST   /api/admin/surveys                → Yeni anket oluştur
PATCH  /api/admin/surveys/:id            → Anket güncelle
DELETE /api/admin/surveys/:id            → Anket sil
PATCH  /api/admin/surveys/:id/status     → Publish/draft/close

GET    /api/admin/surveys/:id/sections        → Bölümleri listele
POST   /api/admin/surveys/:id/sections        → Bölüm ekle
PATCH  /api/admin/sections/:id               → Bölüm güncelle
DELETE /api/admin/sections/:id               → Bölüm sil
PUT    /api/admin/surveys/:id/sections/reorder → Bölüm sırala

GET    /api/admin/sections/:id/questions      → Soruları listele
POST   /api/admin/sections/:id/questions      → Soru ekle
PATCH  /api/admin/questions/:id              → Soru güncelle
DELETE /api/admin/questions/:id              → Soru sil
PUT    /api/admin/sections/:id/questions/reorder → Soru sırala

POST   /api/admin/questions/:id/options       → Opsiyon ekle
PATCH  /api/admin/options/:id                → Opsiyon güncelle
DELETE /api/admin/options/:id                → Opsiyon sil

GET    /api/admin/surveys/:id/responses       → Cevap listesi (filtre/sırala)
GET    /api/admin/surveys/:id/stats           → İstatistikler
GET    /api/admin/surveys/:id/export/csv      → CSV export

GET    /api/admin/users                       → Kullanıcı listesi
PATCH /api/admin/users/:id/role               → Kullanıcı rolü değiştir
POST   /api/admin/surveys/:id/assignments     → Yetki ata
PATCH  /api/admin/assignments/:id             → Yetki güncelle
DELETE /api/admin/assignments/:id             → Yetki kaldır

GET    /api/admin/activity-log                → Audit log
```

### 7.4 Saatlik Polling Stratejisi

```
Admin Dashboard → SWR: refreshInterval: 3600000 (1 saat)
                + Manuel "Yenile" butonu
                + Son güncelleme saati göstergesi
                + Cache-Control: s-maxage=3600
```

---

## 8. Dosya Yapısı

```
cursoranket/
├── apps/
│   ├── web/                              ← Cloudflare Pages (React SPA)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/                   ← shadcn/ui bileşenleri
│   │   │   │   ├── survey/               ← Anket form bileşenleri
│   │   │   │   │   ├── SurveyForm.tsx
│   │   │   │   │   ├── QuestionRenderer.tsx
│   │   │   │   │   ├── ShortTextInput.tsx
│   │   │   │   │   ├── LongTextInput.tsx
│   │   │   │   │   ├── SingleChoiceInput.tsx
│   │   │   │   │   ├── MultipleChoiceInput.tsx
│   │   │   │   │   ├── DropdownInput.tsx
│   │   │   │   │   ├── LinearScaleInput.tsx
│   │   │   │   │   ├── RatingInput.tsx
│   │   │   │   │   ├── YesNoInput.tsx
│   │   │   │   │   ├── DateInput.tsx
│   │   │   │   │   ├── NumberInput.tsx
│   │   │   │   │   ├── RankingInput.tsx
│   │   │   │   │   └── MatrixInput.tsx
│   │   │   │   ├── auth/                 ← Auth bileşenleri
│   │   │   │   │   ├── LoginButton.tsx
│   │   │   │   │   ├── UserMenu.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   └── admin/               ← Admin paneli bileşenleri
│   │   │   │       ├── Dashboard.tsx
│   │   │   │       ├── QuestionManager.tsx
│   │   │   │       ├── SortableSection.tsx
│   │   │   │       ├── SortableQuestion.tsx
│   │   │   │       ├── OptionEditor.tsx
│   │   │   │       ├── ResponseTable.tsx
│   │   │   │       ├── UserRolesManager.tsx
│   │   │   │       ├── AnalyticsPanel.tsx
│   │   │   │       ├── SurveyStatusToggle.tsx
│   │   │   │       └── CsvExportButton.tsx
│   │   │   ├── pages/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── SurveyPage.tsx
│   │   │   │   ├── ThankYouPage.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── AdminLayout.tsx
│   │   │   │       ├── SurveysPage.tsx
│   │   │   │       ├── SurveyEditor.tsx
│   │   │   │       ├── ResponsesPage.tsx
│   │   │   │       └── UsersPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useSurvey.ts
│   │   │   │   └── useAdmin.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts              ← API client (fetch wrapper)
│   │   │   │   ├── auth.ts             ← Auth client config
│   │   │   │   └── utils.ts            ← cn() helper
│   │   │   ├── stores/
│   │   │   │   └── auth-store.ts       ← Zustand auth state
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css               ← Tailwind base
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   ├── components.json              ← shadcn/ui config
│   │   └── package.json
│   │
│   ├── api/                              ← Render (Hono.js Backend)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts       ← Google OAuth endpoints
│   │   │   │   ├── survey.routes.ts     ← Anket CRUD (public)
│   │   │   │   ├── response.routes.ts   ← Cevap gönderme
│   │   │   │   ├── admin.routes.ts      ← Admin-only endpoints
│   │   │   │   └── user.routes.ts       ← Kullanıcı yönetimi
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              ← JWT/session doğrulama
│   │   │   │   ├── rbac.ts              ← Rol bazlı erişim kontrolü
│   │   │   │   ├── rateLimit.ts         ← Rate limiting
│   │   │   │   ├── validate.ts          ← Zod schema validation
│   │   │   │   └── security.ts          ← Helmet, CORS, sanitization
│   │   │   ├── db/
│   │   │   │   ├── schema.ts            ← Drizzle şema tanımı
│   │   │   │   ├── migrations/          ← Drizzle migration dosyaları
│   │   │   │   └── index.ts             ← DB connection
│   │   │   ├── services/
│   │   │   │   ├── survey.service.ts
│   │   │   │   ├── response.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── lib/
│   │   │   │   └── auth.config.ts       ← better-auth konfigürasyonu
│   │   │   └── index.ts                 ← Hono app entry
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── worker/                           ← Cloudflare Workers (BFF Proxy)
│       ├── src/
│       │   ├── index.ts                  ← Worker entry point
│       │   ├── routes.ts                 ← Proxy route tanımları
│       │   ├── middleware/
│       │   │   ├── turnstile.ts          ← Turnstile doğrulama
│       │   │   ├── rateLimit.ts          ← Upstash rate limit
│       │   │   └── cors.ts               ← CORS enforcement
│       │   └── utils/
│       │       └── headers.ts            ← Security headers
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   └── shared/                           ← Ortak tip tanımları
│       ├── src/
│       │   ├── types/
│       │   │   ├── survey.ts
│       │   │   ├── question.ts
│       │   │   ├── response.ts
│       │   │   └── user.ts
│       │   └── schemas/                  ← Zod validation schemas
│       │       ├── survey.schema.ts
│       │       ├── question.schema.ts
│       │       ├── response.schema.ts
│       │       └── assignment.schema.ts
│       └── package.json
│
├── plan.md                               ← BU DOSYA
├── .env.example                          ← Örnek çevre değişkenleri
├── turbo.json                            ← Turborepo monorepo config
├── pnpm-workspace.yaml                   ← pnpm workspace config
├── package.json                          ← Workspace root
├── tsconfig.base.json                    ← Ortak TypeScript config
└── .gitignore
```

---

## 9. Ortam Değişkenleri

### `.env.example`

```env
# NEON DATABASE
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# better-auth
BETTER_AUTH_SECRET=generate-a-256-bit-secret-here
BETTER_AUTH_URL=http://localhost:3001

# ADMIN
ADMIN_EMAIL=admin@gmail.com

# CLOUDFLARE TURNSTILE
TURNSTILE_SECRET_KEY=0x4AAAAAAAxxx

# UPSTASH REDIS (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# BACKEND API
API_PORT=3001

# FRONTEND
FRONTEND_URL=http://localhost:5173
```

---

## 10. Deployment Stratejisi

### 10.1 DNS & Trafik Akışı

```
yourdomain.com → Cloudflare DNS (Proxied)
    ├── /             → Cloudflare Pages (SPA)
    ├── /api/*        → Cloudflare Workers (BFF Proxy)
    └── Workers → Render (Backend API)
```

### 10.2 Cloudflare Ayarları

| Ayar | Değer |
|------|-------|
| SSL Mode | Full (Strict) |
| Always Use HTTPS | On |
| Minimum TLS | 1.2 |
| Bot Fight Mode | On |
| Browser Integrity Check | On |
| Security Level | Medium |
| Challenge Passage | 30 min |
| WAF Managed Rules | On (OWASP + Cloudflare) |

### 10.3 Render Ayarları

| Ayar | Değer |
|------|-------|
| Runtime | Node.js |
| Build Command | `cd apps/api && pnpm install && pnpm build` |
| Start Command | `cd apps/api && pnpm start` |
| Environment | Node 20+ |
| Health Check | `/api/health` |

### 10.4 Keep-Alive Stratejisi
- Render free tier 15 dk boşlukta sleep moduna geçer
- Dışarıdan bir cron servisi (örn: cron-job.org, UptimeRobot) her 14 dakikada bir `GET /api/health` endpoint'ine ping atar
- Bu sayede Render sürekli uyanık kalır

### 10.5 IP Whitelist (Render)
- Render'da firewall rule: sadece Cloudflare IP'lerinden gelen istekler kabul edilir
- Cloudflare IP listesi: https://cloudflare.com/ips/
- Bu, backend'e doğrudan erişimi engeller

---

## 11. Free Tier Bütçe Analizi

| Servis | Free Tier Limiti | Risk |
|--------|-----------------|-------|
| **Cloudflare Pages** | 500 build/ay, unlimited bandwidth | ✅ Yeterli |
| **Cloudflare Workers** | 100K req/gün | ✅ BFF proxy için yeterli |
| **Render** | 750 saat/ay, 512MB RAM | ✅ Keep-alive ile 720 saat |
| **Neon** | 0.5 GB storage, 100 compute hrs/ay | ⚠️ 10K+ kullanıcıda dikkat |
| **Upstash Redis** | 10K cmd/gün | ✅ Rate limiting için yeterli |
| **Cloudflare Turnstile** | Unlimited | ✅ |
| **Google OAuth** | Ücretsiz | ✅ |

**Ölçeklenme Planı:** Neon free tier yetmediğinde → Neon Pro ($19/ay). Render free tier yetmediğinde → Render Starter ($7/ay).

---

## 12. Implementasyon Sırası

### Adım ① — Proje Kurulumu
- [ ] Monorepo kurulumu (pnpm workspace + Turborepo)
- [ ] `package.json` dosyaları (root, web, api, worker, shared)
- [ ] TypeScript konfigürasyonları
- [ ] Tailwind CSS kurulumu
- [ ] `.gitignore`, `.env.example`
- [ ] Git init + ilk commit

### Adım ② — Veritabanı Şeması + Migration
- [ ] Drizzle ORM konfigürasyonu
- [ ] Tüm tablo şemaları (`schema.ts`)
- [ ] İlk migration oluşturma
- [ ] Neon veritabanı oluşturma
- [ ] Migration uygulama

### Adım ③ — Backend API (Hono.js)
- [ ] Hono app kurulumu
- [ ] Middleware'ler (auth, rbac, rate limit, security, validate)
- [ ] Auth routes (Google OAuth + better-auth)
- [ ] Survey routes (public)
- [ ] Response routes
- [ ] Admin routes
- [ ] User routes
- [ ] Error handling
- [ ] Health check endpoint

### Adım ④ — Cloudflare Worker (BFF Proxy)
- [ ] Hono worker kurulumu
- [ ] Proxy route'ları
- [ ] Turnstile doğrulama middleware
- [ ] Upstash rate limiting middleware
- [ ] CORS middleware
- [ ] Security headers
- [ ] Request size limit

### Adım ⑤ — Frontend (React + Vite)
- [ ] Vite + React kurulumu
- [ ] React Router konfigürasyonu
- [ ] API client
- [ ] Auth entegrasyonu (login/logout/session)
- [ ] Anket form sayfası
- [ ] Tüm soru tipi bileşenleri (12 tip)
- [ ] Teşekkür sayfası
- [ ] Hata sayfaları

### Adım ⑥ — Auth Entegrasyonu
- [ ] better-auth konfigürasyonu (backend)
- [ ] Google OAuth setup (Google Cloud Console)
- [ ] Login/logout flow (frontend)
- [ ] Session management
- [ ] Admin email tanıma
- [ ] Protected route wrapper

### Adım ⑦ — Admin Paneli
- [ ] Admin layout + sidebar
- [ ] Dashboard (istatistikler)
- [ ] Anket yönetimi (CRUD)
- [ ] Soru yönetimi (inline ekleme/düzenleme/silme)
- [ ] @dnd-kit ile sürükle-bırak sıralama
- [ ] Bölüm yönetimi
- [ ] Opsiyon yönetimi
- [ ] Publish/draft toggle
- [ ] Cevap tablosu (filtreleme, sıralama)
- [ ] CSV export
- [ ] Kullanıcı yetki yönetimi
- [ ] Skala ortalamaları

### Adım ⑧ — Güvenlik Katmanları
- [ ] Cloudflare WAF kuralları
- [ ] Turnstile entegrasyonu (frontend + worker)
- [ ] Rate limiting (worker + backend)
- [ ] Honeypot alanları
- [ ] Timing check
- [ ] DOMPurify sanitization
- [ ] Security headers
- [ ] IP whitelist (Render)
- [ ] Audit log
- [ ] Penetrasyon test kontrol listesi

### Adım ⑨ — Deployment
- [ ] Neon veritabanı oluşturma + migration
- [ ] Render deploy
- [ ] Cloudflare Pages deploy
- [ ] Cloudflare Workers deploy
- [ ] DNS ayarları
- [ ] SSL konfigürasyonu
- [ ] Keep-alive cron ayarı
- [ ] Production test
