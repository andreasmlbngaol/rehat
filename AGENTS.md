<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# REHAT - Rencana Pengerjaan Backend

Sumber kebenaran: `docs/SRS Kelompok 5.pdf` (93 halaman).
Ruang lingkup dokumen ini: **backend saja**. UI/UX belum selesai, sehingga seluruh pekerjaan
difokuskan pada Route Handlers, akses data, integrasi eksternal, dan dokumentasi API. Halaman
frontend hanya dibuat sebatas yang dibutuhkan untuk memverifikasi backend (Swagger UI dan
halaman diagnostik minimal).

---

## 0. Kondisi Proyek Saat Ini

| Aspek | Kondisi |
|---|---|
| Framework | Next.js 16.4.5 App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true` |
| Bahasa | TypeScript 5.9.3, strict |
| Package manager | Bun 1.4.3 (`bun.lock`) |
| Styling | Tailwind CSS 4.3.4 + shadcn/ui (`radix-nova`) |
| ORM | Prisma 7.10.1, generator `prisma-client`, output `lib/generated/prisma` |
| Database | Supabase PostgreSQL 17.6 - session pooler port 5432 |
| Auth | Supabase Auth (belum dikonfigurasi di kode) |
| Integrasi | Midtrans Snap sandbox, Zoom S2S OAuth, Resend, Cloudflare R2 - kredensial sudah ada di `.env` dan sudah diverifikasi |
| Docker | `Dockerfile` + `compose.yaml` target `dev` (Bun) |
| Skema Prisma | Masih kosong (hanya generator + datasource) |
| `supabase/` | Kosong |

### 0.1 Deviasi terhadap SRS

Semua deviasi sudah disosialisasikan lewat `docs/Catatan Perubahan SRS 1-3.pdf`. Rencana ini
memakai kondisi aktual, bukan versi di SRS.

| Item | SRS | Aktual | Keputusan |
|---|---|---|---|
| Next.js | 16.3.5 | 16.4.5 | Pertahankan; SRS diubah |
| React | 19.2.8 | 19.3.1 | Pertahankan |
| Node.js | 24.15.0 | 24.21.0 | Pertahankan |
| Docker | 29.8.1 | 29.9.2 | Pertahankan |
| Package manager | npm + `package-lock.json` | Bun 1.4.3 | Pertahankan Bun; SRS §2.4 butir 4 dan §5.2.13 diubah |
| Prisma runtime | tidak dirinci | Prisma 7 wajib driver adapter | Tambah `@prisma/adapter-pg` + `pg` |
| Validasi input | tidak disebut | belum ada | Tambah `zod` (dependensi langsung, bukan transitif) |

### 0.2 Prinsip Kerja

1. Semua operasi yang memakai kredensial rahasia dijalankan di server (`import "server-only"`).
2. Frontend tidak pernah dipercaya untuk harga, status pembayaran, peran, atau kepemilikan sesi.
3. Semua waktu disimpan `timestamptz` UTC; konversi ke WIB hanya terjadi di lapisan presentasi.
4. Semua respons API memakai envelope yang sama dan kode error yang stabil.
5. Setiap operasi yang berisiko ganda memakai idempotency key.
6. Tidak ada `console.log` berisi token, password, `start_url`, atau isi pesan.
7. Nama variabel/fungsi dalam bahasa Inggris; pesan yang dilihat pengguna dalam bahasa Indonesia.

---

## 1. Keputusan Arsitektur

### 1.1 Gaya API - Route Handlers, bukan Server Actions

SRS §5.2.16 mewajibkan dokumentasi OpenAPI + Swagger UI untuk endpoint internal. Server Actions
tidak dapat didokumentasikan sebagai endpoint HTTP. Karena itu seluruh backend diekspos sebagai
**Route Handlers** di `/api/v1/**`. Frontend nanti cukup memanggil `fetch` ke endpoint yang sama.

Konsekuensi:
- Autentikasi dibaca dari cookie Supabase pada setiap request (`createServerClient`).
- Tidak ada logika bisnis di komponen React.
- Semua endpoint punya kontrak request/response yang bisa diuji dengan `curl`.

### 1.2 Autentikasi dan Otorisasi

- `@supabase/ssr` untuk cookie-based session di server.
- `proxy.ts` (pengganti `middleware.ts` di Next.js 16) hanya me-refresh session dan melakukan
  optimistic redirect untuk halaman. **Bukan** tempat otorisasi.
- Setiap Route Handler memanggil `requireUser()` → `supabase.auth.getUser()` (validasi ke server
  Supabase, bukan sekadar decode JWT), lalu memuat `profiles` dari database.
- `requireRole(...roles)` memeriksa `profiles.role` dan `profiles.is_active`.
- Akun nonaktif (`is_active = false`) ditolak 403 di semua endpoint terproteksi (FR-ADM-009,
  NFR-SEC-007).
- Profil dibuat otomatis oleh trigger database pada `auth.users` (lihat §3.3), sehingga tidak ada
  window di mana user terautentikasi tetapi profil belum ada.

### 1.3 Akses Database

- Prisma 7 membutuhkan driver adapter. Gunakan:

  ```ts
  import { PrismaPg } from "@prisma/adapter-pg";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  ```

- Koneksi memakai **session pooler** Supabase (port 5432) yang sudah ada di `.env`. Batasi
  `max` pool kecil (5) karena pooler punya batas koneksi.
- Prisma memakai role `postgres` sehingga **melewati RLS**. RLS tetap diaktifkan sebagai
  pertahanan berlapis untuk akses dari Supabase Client/Realtime (NFR-SEC-004), bukan sebagai
  satu-satunya otorisasi. Otorisasi utama tetap di application layer.
- Foreign key ke `auth.users` tidak dibuat melalui Prisma (lintas schema, akan dikelola ulang
  oleh `prisma migrate`). Integritas dijamin oleh trigger `handle_new_user` dan validasi backend.

### 1.4 Realtime Chat

- Sumber data: tabel `chat_messages` (sesuai SRS §5.2.7).
- Publikasi: `ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;`
- `REPLICA IDENTITY FULL` agar filter `session_id=eq.<uuid>` bekerja.
- RLS `SELECT` pada `chat_messages` hanya untuk Pasien/Konselor yang terlibat sesi.
- Tidak ada policy `INSERT/UPDATE/DELETE` untuk role `authenticated`; semua penulisan lewat
  backend (FR-CHAT-004). Admin tidak punya policy sama sekali (FR-ADM-019).
- Client FE nanti berlangganan `postgres_changes` dengan filter `session_id`.

### 1.5 Pembayaran

- Midtrans Snap dibuat di server dengan `midtrans-client`; `serverKey` tidak pernah dikirim ke client.
- `midtrans_order_id` unik per percobaan: `RHT-{bookingCode}-{attempt}`.
- Webhook `POST /api/v1/webhooks/midtrans`:
  1. baca raw body, hitung `event_hash = sha256(rawBody)`;
  2. simpan `payment_webhook_events` dengan `ON CONFLICT DO NOTHING` (idempotensi, FR-PAY-026);
  3. verifikasi `signature_key = sha512(order_id + status_code + gross_amount + serverKey)`;
  4. cocokkan `order_id` dan `gross_amount` dengan database;
  5. petakan status dan perbarui `payments` + `bookings` + `time_slots` dalam satu transaksi;
  6. respons 200 cepat; pembuatan Zoom dijalankan lewat `after()`.
- Notifikasi dengan signature tidak valid tetap dicatat (`signature_valid = false`) tetapi tidak
  mengubah status apa pun (FR-PAY-017, FR-PAY-019).
- Pemetaan status Midtrans → internal:

  | Midtrans | Payment | Booking | Slot |
  |---|---|---|---|
  | `capture` + `fraud_status=accept`, `settlement` | `success` | `confirmed` | `booked` |
  | `pending`, `authorize` | `pending` | `pending_payment` | `held` |
  | `deny`, `failure` | `failed` | `expired` | `available` |
  | `cancel` | `cancelled` | `cancelled` | `available` |
  | `expire` | `expired` | `expired` | `available` |

- Batas waktu pembayaran: `BOOKING_PAYMENT_TTL_MINUTES` (default 60 menit), dikirim ke Snap
  melalui parameter `expiry`.

### 1.6 Zoom

- Server-to-Server OAuth: `POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=...`
  dengan Basic Auth `clientId:clientSecret`.
- Token di-cache di memori modul sampai 60 detik sebelum `expires_in` habis.
- Meeting dibuat dengan `POST https://api.zoom.us/v2/users/me/meetings`,
  `start_time` ISO 8601 UTC, `timezone: "UTC"`, `duration = min(service.durationMinutes, 40)`.
- Satu sesi maksimal satu meeting (`zoom_meetings.session_id` unik).
- Retry memeriksa meeting yang sudah ada terlebih dahulu (FR-ZOOM-012, FR-ADM-023).
- Kegagalan Zoom tidak mengubah status pembayaran (FR-PAY-033, FR-ZOOM-023).

### 1.7 Email

Dua lapis, dipilih saat konfigurasi Supabase:

1. **Utama (disarankan):** Supabase Auth → Hooks → *Send Email Hook* mengarah ke
   `POST /api/v1/auth/email-hook`. Route memverifikasi secret hook lalu mengirim email via Resend
   dengan template REHAT. Ini memenuhi SRS §5.2.11 secara harfiah (Resend dipakai bersama Supabase Auth).
2. **Fallback:** konfigurasi SMTP Supabase ke `smtp.resend.com:465` (user `resend`, password API key).
   Tidak ada kode aplikasi yang terlibat.

Rencana implementasi memakai opsi 1, dengan opsi 2 didokumentasikan sebagai fallback operasional.

### 1.8 Penyimpanan Foto Profil

- Upload server-side `POST /api/v1/profile/avatar` (multipart).
- Validasi: MIME + magic bytes (JPG/PNG/WebP) + ukuran ≤ 5 MB.
- Object key: `avatars/{userId}/{uuid}.{ext}`.
- Setelah upload berhasil: update `profiles.avatar_key`, hapus object lama (best effort).
- URL publik dibentuk dari `R2_PUBLIC_URL` + key.

### 1.9 Konkurensi dan Integritas

Tidak mengandalkan exclusion constraint Prisma (tidak bisa dideklarasikan di schema dan berisiko
di-drop saat migrasi berikutnya). Gunakan:

- Transaksi `prisma.$transaction` dengan `isolationLevel: Serializable` untuk pembuatan booking.
- `SELECT ... FOR UPDATE` pada baris `time_slots` yang dipilih.
- `pg_advisory_xact_lock(hashtext(...))` per `counselor_id`, `patient_id`, dan `'zoom-global'`
  untuk mencegah benturan lintas slot.
- Unique index yang bisa dinyatakan Prisma: `booking_code`, `idempotency_key`,
  `midtrans_order_id`, `event_hash`, `counseling_sessions.booking_id`, `zoom_meetings.session_id`,
  `@@unique([session_id, client_message_id])`.
- Pemeriksaan overlap sesi terkonfirmasi dilakukan di dalam transaksi yang sama.

### 1.10 Waktu

- Semua kolom `DateTime` Prisma → `timestamptz` (PostgreSQL).
- Helper `lib/time.ts`: `toWIB()`, `formatTanggalIndonesia()`, `isWithinWindow()`.
- API selalu mengembalikan ISO 8601 UTC (`2026-11-07T10:00:00.000Z`).
- Frontend nanti yang memformat WIB; backend menyediakan field turunan `*_wib` hanya bila diminta
  dokumentasi (tidak wajib).

---

## 2. Struktur Folder yang Akan Dibuat

```
app/
  api/
    v1/
      auth/
        signup/route.ts
        login/route.ts
        logout/route.ts
        oauth/google/route.ts
        resend-verification/route.ts
        forgot-password/route.ts
        reset-password/route.ts
        email-hook/route.ts
      profile/
        route.ts
        avatar/route.ts
      services/
        route.ts
        [id]/route.ts
      counselors/
        route.ts
        [id]/route.ts
      time-slots/route.ts
      bookings/
        route.ts
        [id]/route.ts
        [id]/payments/route.ts
      payments/route.ts
      sessions/
        route.ts
        [id]/route.ts
        [id]/messages/route.ts
        [id]/zoom/route.ts
      counselor/
        profile/route.ts
        time-slots/route.ts
        time-slots/[id]/route.ts
      admin/
        stats/route.ts
        users/route.ts
        users/[id]/route.ts
        counselors/route.ts
        counselors/[id]/route.ts
        services/route.ts
        services/[id]/route.ts
        time-slots/route.ts
        time-slots/[id]/route.ts
        bookings/route.ts
        payments/route.ts
        sessions/route.ts
        zoom/[sessionId]/retry/route.ts
      webhooks/midtrans/route.ts
      health/route.ts
    docs/route.ts
  auth/
    callback/route.ts
    confirm/route.ts
  docs/page.tsx
proxy.ts

lib/
  env.ts
  prisma.ts
  time.ts
  api/
    response.ts
    errors.ts
    handler.ts
    rate-limit.ts
  auth/
    dal.ts
    roles.ts
  supabase/
    server.ts
    client.ts
    admin.ts
  validation/
    auth.ts
    profile.ts
    service.ts
    counselor.ts
    time-slot.ts
    booking.ts
    payment.ts
    chat.ts
    common.ts
  services/
    booking.service.ts
    payment.service.ts
    session.service.ts
    chat.service.ts
    zoom.service.ts
    catalog.service.ts
    admin.service.ts
  integrations/
    midtrans.ts
    zoom.ts
    resend.ts
    r2.ts
  dto/
    booking.ts
    payment.ts
    session.ts
    catalog.ts
    user.ts
  openapi/
    registry.ts

prisma/
  schema.prisma
  seed.ts
  sql/
    0001_supabase_auth.sql
    0002_rls_realtime.sql

scripts/
  apply-supabase-sql.ts
  generate-openapi.ts
  simulate-midtrans-webhook.ts
  smoke.ts
```

### 2.1 Struktur Frontend Aktual

```
app/
  (public)/                 # header + footer publik
    page.tsx                # beranda
    services/[id]/          # detail layanan
    counselors/[id]/        # detail konselor
    login/ register/ verify-email/ forgot-password/ reset-password/
    contact/ faq/ privacy/ terms/
  dashboard/
    (overview)/             # route group agar loading.tsx hanya untuk beranda
    bookings/ bookings/new/ bookings/[id]/ bookings/[id]/payment/
    sessions/ sessions/[id]/ profile/
  counselor/
    (overview)/ profile/ schedule/ sessions/ sessions/[id]/
  admin/
    (overview)/ users/ counselors/ services/ time-slots/
    bookings/ payments/ sessions/
  auth/callback/ auth/confirm/ docs/ unauthorized/
  loading.tsx error.tsx not-found.tsx global-error.tsx

components/
  layout/      # dashboard-shell, public-header/footer, navigation-progress
  ui/          # button, dialog, table, skeleton, page-skeleton, loading-state, dll.
  auth/ profile/ schedule/ session/ providers/
lib/hooks/use-api.ts        # fetch + status + loading/refreshing + refetch
lib/auth/redirect.ts        # safeRedirectPath() - validasi tujuan redirect
```

Route group `(overview)` dipakai supaya `loading.tsx` hanya membungkus halaman
beranda tiap peran, bukan seluruh halaman turunannya. Halaman turunan punya
skeleton sendiri sesuai bentuk kontennya.

---

## 3. Model Data

### 3.1 Enum

```prisma
enum UserRole            { patient counselor admin }
enum CounselingMethod    { chat zoom }
enum TimeSlotStatus      { available held booked }
enum BookingStatus       { pending_payment confirmed cancelled expired }
enum PaymentStatus       { pending success failed cancelled expired }
enum SessionStatus       { scheduled active completed }
enum ZoomIntegrationStatus { pending created failed }
```

### 3.2 Tabel

Semua PK `String @id @default(uuid()) @db.Uuid`, kecuali disebut lain.

| Model | Kolom kunci | Constraint |
|---|---|---|
| `Profile` (`profiles`) | `id` (PK = auth uid), `fullName`, `email`, `role`, `avatarKey?`, `isActive`, `createdAt`, `updatedAt` | index `email`, `role` |
| `CounselorProfile` | `counselorId` (PK, FK Profile), `specialization`, `bio?`, `createdAt`, `updatedAt` | 1:1 |
| `Service` (`services`) | `id`, `name`, `description`, `durationMinutes`, `price Decimal(12,2)`, `isActive`, `createdAt`, `updatedAt` | `durationMinutes > 0`, `price >= 0` divalidasi zod |
| `ServiceMethod` | `serviceId`, `method` | `@@id([serviceId, method])` |
| `CounselorService` | `counselorId`, `serviceId` | `@@id([counselorId, serviceId])` |
| `TimeSlot` (`time_slots`) | `id`, `counselorId`, `createdBy`, `startTime`, `endTime`, `status`, `createdAt`, `updatedAt` | index `(counselorId, startTime)` |
| `Booking` (`bookings`) | `id`, `bookingCode @unique`, `patientId`, `counselorId`, `serviceId`, `timeSlotId`, `method`, `status`, `paymentExpiresAt?`, `idempotencyKey @unique`, `serviceName`, `durationMinutes`, `price`, `scheduledStart`, `scheduledEnd`, `createdAt`, `updatedAt` | index `(patientId, createdAt)`, `(counselorId, scheduledStart)`, `(status)` |
| `Payment` (`payments`) | `id`, `bookingId`, `midtransOrderId @unique`, `snapToken?`, `midtransTransactionId?`, `grossAmount`, `paymentType?`, `status`, `transactionTime?`, `expiresAt?`, `createdAt`, `updatedAt` | index `(bookingId, status)` |
| `PaymentWebhookEvent` | `id`, `paymentId?`, `midtransOrderId`, `transactionStatus?`, `signatureValid`, `rawPayload Json`, `eventHash @unique`, `processedAt?`, `createdAt` | index `midtransOrderId` |
| `CounselingSession` | `id`, `bookingId @unique`, `status`, `startedAt?`, `endedAt?`, `createdAt`, `updatedAt` | 1:1 booking |
| `ChatMessage` (`chat_messages`) | `id`, `sessionId`, `senderId`, `content`, `clientMessageId`, `createdAt` | `@@unique([sessionId, clientMessageId])`, index `(sessionId, createdAt)` |
| `ZoomMeeting` | `id`, `sessionId @unique`, `zoomMeetingId?`, `joinUrl?`, `startUrl?`, `startTime`, `durationMinutes`, `integrationStatus`, `attemptCount`, `lastError?`, `createdAt`, `updatedAt` | 1:1 session |

### 3.3 SQL di Luar Prisma

File `prisma/sql/0001_supabase_auth.sql`:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, is_active, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.raw_app_meta_data->>'role' = 'counselor' then 'counselor'::public."UserRole"
      when new.raw_app_meta_data->>'role' = 'admin'     then 'admin'::public."UserRole"
      else 'patient'::public."UserRole"
    end,
    true, now(), now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

Catatan keamanan: role hanya dibaca dari `raw_app_meta_data` (hanya bisa ditulis service role),
bukan `raw_user_meta_data` yang bisa dikirim saat signup.

File `prisma/sql/0002_rls_realtime.sql`:

```sql
alter table public.profiles              enable row level security;
alter table public.counselor_profiles    enable row level security;
alter table public.services              enable row level security;
alter table public.service_methods       enable row level security;
alter table public.counselor_services    enable row level security;
alter table public.time_slots            enable row level security;
alter table public.bookings              enable row level security;
alter table public.payments              enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.counseling_sessions   enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.zoom_meetings         enable row level security;

-- Pasien/Konselor hanya bisa SELECT pesan dari sesi yang melibatkan dirinya.
create policy chat_messages_select_participant
on public.chat_messages for select to authenticated
using (
  exists (
    select 1
    from public.counseling_sessions cs
    join public.bookings b on b.id = cs.booking_id
    where cs.id = chat_messages.session_id
      and (b.patient_id = auth.uid() or b.counselor_id = auth.uid())
  )
);

alter table public.chat_messages replica identity full;
alter publication supabase_realtime add table public.chat_messages;
```

Tidak ada policy lain: seluruh akses lain lewat backend dengan role `postgres` yang melewati RLS.

### 3.4 Seed

`prisma/seed.ts` (idempoten, memakai upsert):

- Admin dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default `admin@rehat.com`, dibuat
  via Supabase Admin API, `email_confirm: true`).
- Seed tidak membuat layanan, konselor, atau patient. Layanan dan konselor dibuat lewat
  dashboard admin; patient mendaftar sendiri lewat `/register`.

---

## 4. Kontrak API

### 4.1 Envelope Respons

```json
{
  "success": true,
  "data": {},
  "message": "Pemesanan berhasil dibuat.",
  "errors": null,
  "code": null
}
```

Gagal:

```json
{
  "success": false,
  "data": null,
  "message": "Jadwal yang dipilih sudah tidak tersedia.",
  "errors": { "timeSlotId": ["Jadwal sudah dipesan."] },
  "code": "SLOT_UNAVAILABLE"
}
```

### 4.2 Kode Error

| Code | HTTP | Kapan |
|---|---|---|
| `VALIDATION_ERROR` | 422 | zod gagal |
| `UNAUTHENTICATED` | 401 | tidak ada/invalid session |
| `ACCOUNT_INACTIVE` | 403 | `profiles.is_active = false` |
| `FORBIDDEN` | 403 | peran/kepemilikan tidak sesuai |
| `NOT_FOUND` | 404 | resource tidak ada atau tidak boleh dilihat |
| `CONFLICT` | 409 | duplikasi/idempotency bentrok |
| `SLOT_UNAVAILABLE` | 409 | slot sudah held/booked/lewat |
| `BOOKING_NOT_PAYABLE` | 409 | status booking tidak memungkinkan bayar |
| `PAYMENT_ALREADY_SUCCESS` | 409 | booking sudah punya pembayaran sukses |
| `SESSION_NOT_ACTIVE` | 409 | kirim pesan di luar jendela sesi |
| `RATE_LIMITED` | 429 | limit terlampaui |
| `EXTERNAL_SERVICE_ERROR` | 502 | Midtrans/Zoom/Resend/R2 gagal |
| `INTERNAL_ERROR` | 500 | fallback |

### 4.3 Endpoint

Kolom **Akses**: `public`, `auth`, `patient`, `counselor`, `admin`.

#### Autentikasi

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | public | FR-AUTH-001..007 |
| POST | `/api/v1/auth/login` | public | FR-AUTH-010/012/014/015 |
| POST | `/api/v1/auth/logout` | auth | FR-AUTH-031 |
| GET | `/api/v1/auth/oauth/google` | public | redirect ke Google (FR-AUTH-011) |
| GET | `/auth/callback` | public | exchange code OAuth |
| GET | `/auth/confirm` | public | verifikasi token email |
| POST | `/api/v1/auth/resend-verification` | public | FR-AUTH-009, rate-limited |
| POST | `/api/v1/auth/forgot-password` | public | FR-AUTH-016 |
| POST | `/api/v1/auth/reset-password` | recovery | FR-AUTH-017/018 |
| POST | `/api/v1/auth/email-hook` | hook secret | Supabase Send Email Hook → Resend |

#### Profil

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/v1/profile` | auth | FR-AUTH-019 |
| PATCH | `/api/v1/profile` | auth | nama, bio konselor (FR-AUTH-019/022, FR-CNS-004) |
| POST | `/api/v1/profile/avatar` | auth | multipart ≤ 5 MB (FR-AUTH-020/021) |
| DELETE | `/api/v1/profile/avatar` | auth | hapus avatar |

#### Katalog publik

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/v1/services` | public | hanya `is_active` (FR-SVC-014) |
| GET | `/api/v1/services/:id` | public | detail + metode (FR-SVC-015) |
| GET | `/api/v1/counselors?serviceId=` | public | hanya aktif + terhubung layanan (FR-CNS-010) |
| GET | `/api/v1/counselors/:id` | public | FR-CNS-011/012 |
| GET | `/api/v1/time-slots?counselorId=&serviceId=&date=` | public | hanya `available` dan belum lewat (FR-SCH-013/018) |

#### Pemesanan

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/v1/bookings` | patient | header `Idempotency-Key` (FR-SCH-019..034, FR-SCH-045) |
| GET | `/api/v1/bookings` | auth | difilter per peran (FR-SCH-037/038/039) |
| GET | `/api/v1/bookings/:id` | peserta/admin | FR-SCH-040..042 |
| POST | `/api/v1/bookings/:id/payments` | patient owner | buat/lanjutkan Snap (FR-PAY-002..014, 027..030) |
| GET | `/api/v1/bookings/:id/payments` | patient owner | FR-PAY-035 |
| GET | `/api/v1/payments` | patient | riwayat pembayaran sendiri (FR-PAY-036) |
| POST | `/api/v1/webhooks/midtrans` | signature | FR-PAY-015..026 |

#### Sesi dan Chat

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/v1/sessions` | auth | sesi milik/ ditugaskan (FR-DSH-003/008) |
| GET | `/api/v1/sessions/:id` | peserta | detail + join URL (FR-DSH-006/010) |
| GET | `/api/v1/sessions/:id/messages?before=&limit=` | peserta | maks 50/halaman (FR-CHAT-028, NFR-PERF-013/017) |
| POST | `/api/v1/sessions/:id/messages` | peserta | idempoten via `clientMessageId` (FR-CHAT-019..025) |
| POST | `/api/v1/sessions/:id/zoom` | counselor owner | retry pembuatan meeting (FR-ZOOM-024) |

#### Konselor

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/v1/counselor/time-slots` | counselor | FR-SCH-001 |
| POST | `/api/v1/counselor/time-slots` | counselor | FR-SCH-002/003/007/008 |
| PATCH | `/api/v1/counselor/time-slots/:id` | counselor owner | FR-SCH-009/010 |
| DELETE | `/api/v1/counselor/time-slots/:id` | counselor owner | FR-SCH-009/010 |

#### Admin

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/v1/admin/stats` | admin | FR-DSH-012 |
| GET | `/api/v1/admin/users` | admin | FR-ADM-004/005/018 |
| GET | `/api/v1/admin/users/:id` | admin | FR-ADM-006 |
| PATCH | `/api/v1/admin/users/:id` | admin | aktif/nonaktif (FR-ADM-007..011) |
| POST | `/api/v1/admin/counselors` | admin | buat akun konselor (FR-AUTH-023..025) |
| PATCH | `/api/v1/admin/counselors/:id` | admin | FR-CNS-003/009 |
| GET/POST | `/api/v1/admin/services` | admin | FR-SVC-001..008 |
| PATCH | `/api/v1/admin/services/:id` | admin | FR-SVC-009/010 |
| GET/POST | `/api/v1/admin/time-slots` | admin | FR-SCH-004/005 |
| PATCH/DELETE | `/api/v1/admin/time-slots/:id` | admin | FR-SCH-005/009 |
| GET | `/api/v1/admin/bookings` | admin | FR-ADM-013/016/017 |
| GET | `/api/v1/admin/payments` | admin | FR-ADM-014 |
| GET | `/api/v1/admin/sessions` | admin | FR-ADM-015/019 |
| POST | `/api/v1/admin/zoom/:sessionId/retry` | admin | FR-ADM-022/023 |

#### Dokumentasi

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/docs` | public | OpenAPI 3 JSON |
| GET | `/docs` | public | Swagger UI |
| GET | `/api/v1/health` | public | cek DB + konfigurasi |

### 4.4 Aturan Otorisasi per Resource

- `bookings/:id`: Pasien hanya jika `patient_id = user.id`; Konselor hanya jika
  `counselor_id = user.id`; Admin hanya field operasional (tanpa isi chat, tanpa `start_url`).
- `sessions/:id/messages`: hanya `patient_id` atau `counselor_id` dari booking terkait.
  Admin **selalu** 403 (FR-ADM-019).
- `zoom_meetings.start_url`: hanya dikembalikan bila `user.id = counselor_id` (FR-ZOOM-016).
  Pasien hanya menerima `join_url`. Keduanya hanya disertakan dalam jendela 10 menit
  sebelum `scheduled_start` sampai `scheduled_end`; di luar jendela nilainya `null`
  dan UI menampilkan hitung mundur.
- Daftar selalu difilter di query, bukan setelah fetch.

---

## 5. Tahapan Pengerjaan

Setiap tahap harus lulus `bun run typecheck` dan `bun run lint` sebelum lanjut.

### Fase 0 - Fondasi

**Tujuan:** menyiapkan dependensi, konfigurasi, dan utilitas dasar.

Pekerjaan:
1. Tambah dependensi: `@prisma/adapter-pg`, `pg`, `zod`; dev: `@types/pg`.
2. `lib/env.ts` - validasi environment dengan zod, pisahkan `serverEnv` dan `publicEnv`;
   gagal cepat saat boot bila ada yang kosong.
3. `lib/prisma.ts` - singleton `PrismaClient` + `PrismaPg`, `globalThis` guard untuk dev.
4. `lib/api/response.ts` - `ok()`, `fail()`.
5. `lib/api/errors.ts` - `AppError` + pemetaan kode.
6. `lib/api/handler.ts` - wrapper `route({ roles, schema, handler })` yang menangani auth,
   validasi, rate limit, dan error.
7. `lib/api/rate-limit.ts` - fixed-window in-memory (dokumentasikan batasannya).
8. `lib/time.ts` - helper UTC/WIB.
9. `.env` + `.env.example`: tambah `NEXT_PUBLIC_SITE_URL`, `BOOKING_PAYMENT_TTL_MINUTES`,
   `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SUPABASE_SEND_EMAIL_HOOK_SECRET`.
10. `package.json`: script `typecheck`, `seed`, `openapi`, `db:setup`.

**Selesai bila:** `bun run typecheck` lulus; `bun run db:generate` menghasilkan client baru.

### Fase 1 - Skema Database, Migrasi, SQL Supabase

**Tujuan:** seluruh 13 tabel + enum ada di database, trigger dan RLS terpasang.

Pekerjaan:
1. Tulis `prisma/schema.prisma` lengkap (§3).
2. Buat migrasi:
   - coba `bunx prisma migrate dev --name init`;
   - bila shadow database ditolak pooler, gunakan
     `bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
     lalu simpan ke `prisma/migrations/0001_init/migration.sql` dan jalankan
     `bunx prisma migrate deploy`.
3. `prisma/sql/0001_supabase_auth.sql` dan `0002_rls_realtime.sql`.
4. `scripts/apply-supabase-sql.ts` - eksekusi kedua file via `pg` Client (idempoten).
5. `prisma/seed.ts`.

**Selesai bila:**
- `\dt` menunjukkan 13 tabel;
- signup test membuat baris `profiles` otomatis;
- `select * from pg_policies where schemaname='public'` menunjukkan policy chat;
- seed idempoten (dijalankan dua kali tidak menggandakan data).

### Fase 2 - Autentikasi, Profil, Avatar

**Tujuan:** alur akun lengkap dan guard peran.

Pekerjaan:
1. `lib/supabase/{server,client,admin}.ts`.
2. `proxy.ts` - refresh cookie, matcher mengecualikan `/api`, aset, dan `/auth/*`.
3. `lib/auth/dal.ts` - `getCurrentUser`, `requireUser`, `requireRole`, `requireActiveUser`.
4. Route auth (§4.3) + `/auth/callback` + `/auth/confirm`.
5. `lib/integrations/resend.ts` + `/api/v1/auth/email-hook` (verifikasi secret, template Indonesia).
6. `lib/integrations/r2.ts` + endpoint avatar.
7. Rate limit pada signup/login/resend/forgot.

**Selesai bila:**
- signup → email verifikasi → login → `GET /profile` 200;
- akun nonaktif → 403 `ACCOUNT_INACTIVE`;
- Pasien membuka endpoint admin → 403;
- upload PNG 1 MB sukses, file .exe ditolak 422, file 6 MB ditolak 422.

### Fase 3 - Katalog Layanan dan Konselor

**Tujuan:** data master untuk pemesanan.

Pekerjaan:
1. `lib/validation/{service,counselor}.ts`.
2. `lib/services/catalog.service.ts`.
3. Endpoint publik dan admin (§4.3).
4. Pembuatan konselor: `supabase.auth.admin.createUser` dengan
   `app_metadata.role = "counselor"`, lalu upsert `counselor_profiles` + `counselor_services`.
5. Pengiriman email aktivasi via `inviteUserByEmail` (fallback) atau hook.

**Selesai bila:**
- layanan nonaktif tidak muncul di publik;
- konselor nonaktif / tidak terhubung layanan tidak muncul;
- admin bisa membuat layanan dengan 1 atau 2 metode;
- perubahan layanan tidak mengubah snapshot booking lama (diuji di Fase 5).

### Fase 4 - Time Slot

**Tujuan:** ketersediaan jadwal yang konsisten.

Pekerjaan:
1. `lib/validation/time-slot.ts`.
2. Aturan: `endTime > startTime`, `startTime > now`, tidak overlap dengan slot lain milik
   konselor yang sama, `endTime - startTime >= durationMinutes` layanan yang dipilih.
3. Endpoint konselor dan admin.
4. Query publik hanya `status = available` dan `startTime > now`.
5. Larangan ubah/hapus slot yang `booked` (FR-SCH-010).

**Selesai bila:**
- slot overlap ditolak 409;
- slot masa lalu ditolak 422;
- slot `booked` tidak bisa dihapus;
- pasien tidak melihat slot `held`/`booked`.

### Fase 5 - Pemesanan

**Tujuan:** booking aman terhadap permintaan bersamaan.

Pekerjaan:
1. `lib/validation/booking.ts`.
2. `lib/services/booking.service.ts`:
   - validasi layanan aktif, konselor aktif + terhubung, metode tersedia;
   - validasi durasi layanan muat di slot;
   - cek overlap pasien/counselors/zoom;
   - lock slot `FOR UPDATE` + advisory lock;
   - set slot `held`, buat booking + snapshot + `payment_expires_at`;
   - idempotency: bila `idempotencyKey` sudah ada, kembalikan booking yang sama (200).
3. Generator `booking_code`: `RHT-YYMMDD-XXXX` (acak, unik, retry saat bentrok).
4. Endpoint list/detail dengan filter peran.
5. `expireStaleBookings()` - dipanggil sebelum list/detail dan dari endpoint health/cron;
   melepas slot dan menandai booking `expired`.

**Selesai bila:**
- dua request paralel ke slot yang sama → satu 201, satu 409;
- request dengan `Idempotency-Key` sama → satu booking;
- booking kedaluwarsa melepas slot;
- pasien lain tidak bisa melihat detail booking.

### Fase 6 - Pembayaran Midtrans

**Tujuan:** Snap + webhook end-to-end di sandbox.

Pekerjaan:
1. `lib/integrations/midtrans.ts` - Snap client, `createTransaction`, expiry.
2. `POST /bookings/:id/payments`:
   - tolak bila booking bukan `pending_payment` atau sudah `success`;
   - bila ada payment `pending` yang belum kedaluwarsa → kembalikan `snapToken` yang ada;
   - selain itu buat `midtrans_order_id` baru, panggil Snap, simpan payment `pending`.
3. `POST /webhooks/midtrans` sesuai §1.5.
4. `after()` → bila `method = zoom` panggil `zoom.service.createMeeting`.
5. `GET /payments`, `GET /bookings/:id/payments`.
6. `scripts/simulate-midtrans-webhook.ts` - membuat signature valid untuk pengujian lokal.

**Selesai bila:**
- Snap token diperoleh dari sandbox;
- webhook signature salah → 200 tetapi tidak ada perubahan status;
- webhook ganda → hanya satu efek;
- `gross_amount` beda → ditolak;
- sukses → booking `confirmed`, slot `booked`, sesi dibuat;
- gagal/expire → slot kembali `available`.

### Fase 7 - Sesi dan Chat

**Tujuan:** chat realtime dengan riwayat dan batas waktu.

Pekerjaan:
1. `lib/services/session.service.ts` - pembuatan sesi saat pembayaran sukses,
   rekonsiliasi status (`scheduled` → `active` → `completed`) berbasis waktu.
2. `lib/services/chat.service.ts`:
   - validasi peserta, status sesi, jendela waktu;
   - trim, tolak kosong, maks 2000 karakter;
   - simpan dengan `client_message_id`; duplikat → kembalikan pesan lama (200).
3. Endpoint pesan + pagination cursor (`before` + `limit` ≤ 50).
4. Pastikan publikasi Realtime + RLS sudah terpasang (Fase 1).
5. Setelah sesi selesai: hanya baca (FR-CHAT-028).

**Selesai bila:**
- pesan hanya bisa dikirim antara `scheduled_start` dan `scheduled_end`;
- admin 403 pada endpoint pesan;
- `clientMessageId` sama tidak menggandakan;
- pesan > 2000 karakter ditolak 422;
- Realtime INSERT diterima client uji dengan JWT peserta.

### Fase 8 - Integrasi Zoom

**Tujuan:** meeting otomatis dan retry aman.

Pekerjaan:
1. `lib/integrations/zoom.ts` - token cache, create meeting, error mapping.
2. `lib/services/zoom.service.ts`:
   - `ensureMeeting(sessionId)` idempoten (cek existing);
   - `attempt_count`, `last_error`, status `pending/created/failed`;
   - durasi `min(duration, 40)`.
3. Trigger otomatis setelah pembayaran Zoom sukses.
4. Endpoint retry konselor dan admin.
5. DTO: `join_url` untuk peserta, `start_url` hanya konselor.

**Selesai bila:**
- meeting dibuat di akun Zoom;
- dua pemanggilan tidak membuat dua meeting;
- kegagalan tidak mengubah status pembayaran;
- pasien tidak pernah menerima `start_url`;
- admin bisa retry dan melihat `last_error`.

### Fase 9 - Dashboard, Riwayat, dan Administrasi

**Tujuan:** seluruh data operasional dan ringkasan.

Pekerjaan:
1. `lib/services/admin.service.ts`.
2. `GET /admin/stats` - jumlah layanan aktif, konselor aktif, booking, transaksi, sesi.
3. Daftar dengan pencarian, filter status/metode/tanggal, pagination ≤ 50.
4. Riwayat: default urut jadwal terbaru, snapshot layanan/harga.
5. Larangan admin melihat isi chat dan `start_url`.
6. Endpoint `sessions` untuk Pasien/Konselor dengan filter peran.

**Selesai bila:**
- setiap peran hanya melihat datanya;
- pencarian dan filter bekerja;
- tidak ada field terlarang di respons admin;
- data historis tetap tampil setelah layanan/counselors dinonaktifkan.

### Fase 10 - OpenAPI, Swagger, dan Verifikasi Akhir

**Tujuan:** dokumentasi API dan bukti kualitas.

Pekerjaan:
1. Anotasi `@openapi` pada setiap route.
2. `lib/openapi/registry.ts` + `scripts/generate-openapi.ts` → `public/openapi.json`.
3. `app/docs/page.tsx` - Swagger UI client component (`ssr: false`).
4. `scripts/smoke.ts` - skenario: signup → login → lihat layanan → booking → webhook sukses →
   sesi → kirim pesan → retry Zoom → admin stats.
5. Jalankan `bun run lint`, `bun run typecheck`, `bun run build`.
6. Uji `docker compose up` masih berjalan.

**Selesai bila:**
- `/docs` menampilkan semua endpoint dengan skema request/response;
- smoke test lulus;
- build production sukses;
- tidak ada secret di `public/openapi.json`.

---

## 6. Matriks Keterlacakan Fitur

| Fitur SRS | Fase | Endpoint/Modul utama |
|---|---|---|
| 3.1 Autentikasi | 2 | `auth/*`, `profile/*`, `dal.ts` |
| 3.2 Layanan & Konselor | 3 | `admin/services`, `admin/counselors`, `catalog.service.ts` |
| 3.3 Pemesanan & Jadwal | 4–5 | `time-slots`, `bookings`, `booking.service.ts` |
| 3.4 Pembayaran | 6 | `bookings/:id/payments`, `webhooks/midtrans`, `payment.service.ts` |
| 3.5 Chat Realtime | 7 | `sessions/:id/messages`, `chat.service.ts`, RLS + publication |
| 3.6 Zoom | 8 | `zoom.service.ts`, `sessions/:id/zoom`, `admin/zoom/:id/retry` |
| 3.7 Dashboard & Riwayat | 9 | `sessions`, `bookings`, `admin/stats` |
| 3.8 Administrasi | 9 | `admin/*` |
| 4.1–4.2 Model data | 1 | `prisma/schema.prisma` |
| 5.2.16 OpenAPI | 10 | `app/docs`, `app/api/docs` |

---

## 7. Konfigurasi Manual (di luar kode)

Hal-hal berikut harus dilakukan di dashboard dan tidak bisa diotomasi dari repository:

1. **Supabase → Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`
2. **Supabase → Authentication → Providers → Google**
   - Aktifkan, isi Client ID/Secret dari Google Cloud Console.
   - Authorized redirect URI Google: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. **Supabase → Authentication → Hooks → Send Email Hook**
   - URL: `http://localhost:3000/api/v1/auth/email-hook` (butuh tunnel untuk dev)
   - Secret disimpan di `SUPABASE_SEND_EMAIL_HOOK_SECRET`.
   - Alternatif: SMTP `smtp.resend.com:465`, user `resend`, password `RESEND_API_KEY`.
4. **Midtrans → Settings → Payment Notification URL**
   - `https://<public-host>/api/v1/webhooks/midtrans`
   - Untuk lokal gunakan tunnel (cloudflared/ngrok).
5. **Cloudflare R2**
   - Bucket sudah ada; pastikan `R2_PUBLIC_URL` dapat diakses publik untuk avatar.
   - Tidak perlu CORS karena upload lewat server.
6. **Zoom**
   - Scopes sudah: `meeting:write:meeting:admin`, `meeting:read:meeting:admin`, `user:read:user:admin`.
7. **Environment produksi (Vercel, nanti)**
   - Semua variabel server-only tidak boleh berprefix `NEXT_PUBLIC_`.

---

## 8. Verifikasi dan Definition of Done

Perintah yang harus lulus:

```bash
bun run db:generate
bun run typecheck
bun run lint
bun run build
bun run seed
bun run smoke
```

Kriteria akhir:

- [ ] Seluruh FR prioritas Critical/High punya endpoint dan uji manual.
- [ ] Tidak ada kredensial di client bundle (`grep -r "SUPABASE_SERVICE_ROLE_KEY\|MIDTRANS_SERVER_KEY" .next/static` kosong).
- [ ] Semua endpoint terproteksi mengembalikan 401 tanpa cookie dan 403 untuk peran salah.
- [ ] Webhook tidak dapat mengubah status tanpa signature valid.
- [ ] Chat hanya dapat ditulis peserta pada jendela sesi.
- [ ] `start_url` Zoom tidak pernah muncul di respons Pasien/Admin.
- [ ] Semua waktu tersimpan UTC dan respons API memakai ISO 8601.
- [ ] `/docs` memuat seluruh endpoint.
- [ ] `docker compose up` berhasil menjalankan aplikasi.

---

## 9. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Prisma 7 + Turbopack bundling driver `pg` | build gagal | `serverExternalPackages` bila perlu; uji build tiap fase |
| Pooler Supabase menolak shadow database | migrasi gagal | gunakan `migrate diff` + `migrate deploy` |
| `swagger-ui-react` menarik `tree-sitter` (build native) | build Docker gagal | gunakan aset prebuilt `swagger-ui-dist` yang disalin ke `public/swagger-ui` |
| Webhook Midtrans tidak bisa mencapai localhost | pembayaran tidak teruji | tunnel + `scripts/simulate-midtrans-webhook.ts` |
| Google OAuth belum punya Client ID | login Google gagal | sementara nonaktifkan tombol; dokumentasikan |
| Akun Zoom gratis | S2S OAuth bisa ditolak | sudah diverifikasi token; retry dan error mapping |
| Rate limit in-memory | tidak akurat di multi-instance | dokumentasikan; cukup untuk MVP |
| RLS hanya pada chat | risiko akses via PostgREST | RLS aktif di semua tabel tanpa policy lain |

---

## 10. Catatan untuk Frontend

- Semua fetch memakai cookie session; tidak perlu menyimpan token di localStorage.
- Gunakan `createBrowserClient` hanya untuk Realtime, bukan untuk query data.
- Format tanggal: `Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ... })`.
- Tangani `code` error untuk menampilkan pesan yang tepat.
- Setelah membuat booking, panggil endpoint payment lalu buka Snap dengan `snap_token`.
- Setelah Snap `onSuccess`, jangan langsung menganggap lunas; poll `GET /bookings/:id`
  sampai status `confirmed` (webhook adalah sumber kebenaran).
- Semua navigasi yang membawa parameter `next` wajib melewati `safeRedirectPath()`
  (`lib/auth/redirect.ts`): hanya path internal, tolak `//`, `\`, `%5C`, dan karakter kontrol.
- URL script Snap dipilih di server dari `MIDTRANS_IS_PRODUCTION`; jangan hard-code sandbox.

### 10.1 Kebijakan Feedback Loading

Skeleton hanya untuk **muat halaman penuh yang strukturnya sudah diketahui**. Untuk
aksi/refetch, pakai indikator yang tidak menggeser layout.

| Situasi | Feedback |
|---|---|
| Navigasi ke halaman baru (route-level `loading.tsx`) | Skeleton sesuai bentuk konten |
| Halaman yang strukturnya belum diketahui (`app/loading.tsx`) | `FullPageSpinner` |
| Refetch data yang sudah tampil | `InlineLoading` di area terkait, UI lama tetap tampil |
| Tombol mutasi (simpan, kirim, bayar) | Spinner di tombol + label berubah + `disabled` |
| Dialog/form yang memuat data | `InlineLoading` di dalam dialog |
| Aksi cepat < 1 detik | Perubahan state tombol (pressed/disabled) sudah cukup |
| Chat memuat pesan lama | Teks "Memuat..." pada tombol, bukan skeleton |
| Navigasi antar halaman | `NavigationProgress` (bar di atas) |

Aturan tambahan:
- `useApi` membedakan `loading` (belum ada data → skeleton) dan `refreshing`
  (data lama masih tampil → `InlineLoading`, jangan kosongkan layar).
- Setiap spinner/skeleton memakai `motion-reduce:animate-none`.
- Wadah loading memakai `role="status"`/`aria-busy`; skeleton individual `aria-hidden`.
- Tombol yang sedang memproses wajib `disabled` agar tidak terkirim ganda.
- Sidebar dashboard: `lg:sticky lg:top-0 lg:h-svh lg:overflow-hidden`, hanya `<nav>`
  yang scroll (`overflow-y-auto overscroll-contain`); tombol keluar selalu terlihat.

---

## 11. Status Implementasi

Seluruh fase 0–10 sudah dikerjakan dan diverifikasi terhadap Supabase, Midtrans sandbox,
Zoom, Resend, serta R2.

| Fase | Status | Bukti verifikasi |
|---|---|---|
| 0 - Fondasi | selesai | `bun run typecheck`, `bun run db:generate` |
| 1 - Skema & migrasi | selesai | 12 tabel + 7 enum, trigger `handle_new_user`, RLS + publikasi Realtime |
| 2 - Auth, profil, avatar | selesai | signup → verifikasi → login → profil; avatar R2; guard peran |
| 3 - Katalog | selesai | layanan/counselors nonaktif tidak tampil; CRUD admin |
| 4 - Time slot | selesai | overlap 409, slot lampau 422, slot `booked` tidak dapat dihapus |
| 5 - Pemesanan | selesai | idempotensi, dua request paralel → satu 201 satu 409 |
| 6 - Pembayaran | selesai | Snap token, webhook valid/ganda/invalid/amount mismatch |
| 7 - Sesi & chat | selesai | jendela sesi, idempotensi pesan, admin 403, pagination |
| 8 - Zoom | selesai | meeting dibuat, idempoten, `start_url` hanya konselor |
| 9 - Dashboard & admin | selesai | stats, pengguna, booking, pembayaran, sesi, retry Zoom |
| 10 - OpenAPI & verifikasi | selesai | 47 path / 59 operasi, `/docs`, smoke test, build produksi |
| Frontend | selesai (fungsional) | semua halaman publik, auth, pasien, konselor, admin, 404/error/loading |
| Observability | selesai | JSON logging + redaksi, health live/ready, `captureException`, CI |
| Testing | selesai | 319 Vitest + 43 E2E Chromium (20 alur + 23 a11y) + 21 lintas browser; coverage 94,92% baris |
| Hardening | selesai | open redirect, batas ukuran upload, CSP Midtrans, guard peran level tipe |

### 11.1 Deviasi saat implementasi

1. **OpenAPI tidak memakai anotasi JSDoc per route.** Spesifikasi ditulis terpusat di
   `lib/openapi/registry.ts` agar tipe respons konsisten dengan DTO dan tidak ada duplikasi.
   Hasilnya tetap OpenAPI 3.1 lengkap di `GET /api/docs` dan `public/openapi.json`.
2. **Swagger UI memakai `swagger-ui-dist`, bukan `swagger-ui-react`.** Wrapper React menarik
   `tree-sitter` yang gagal dikompilasi di image Alpine. Aset prebuilt disalin oleh
   `scripts/copy-swagger-assets.ts` dan dimuat oleh `app/docs/page.tsx`.
3. **`GET /api/v1/health`** disertakan pada fase 10 (sebelumnya disebut di §4.3 tanpa fase).
4. **Docker dev memakai webpack, bukan Turbopack.** Turbopack menaruh paket eksternal
   (`pg`, `@prisma/client`) sebagai symlink di `.next/dev/node_modules`; resolusi tersebut
   gagal di dalam container Bun meskipun berjalan normal di host. `compose.yaml` karena itu
   menjalankan `next dev --webpack`. Di host tetap memakai Turbopack.
5. **CSP tanpa nonce.** Nonce per-request tidak bisa disuntikkan ke HTML halaman statis/Partial
   Prerender; `strict-dynamic` justru memblokir seluruh script sehingga halaman tidak
   ter-hidrasi. Kebijakan final: `script-src 'self' 'unsafe-inline'` + origin Midtrans,
   dengan direktif pembatas lain tetap aktif (`object-src 'none'`, `base-uri 'self'`,
   `frame-ancestors 'none'`, dll.).
6. **`instant = false` + `connection()` pada layout dashboard.** `cacheComponents` mencoba
   memprerender halaman dashboard yang membaca waktu/sesi dan memicu error
   `unstable value Date.now()` berulang di dev. Layout admin/counselors/pasien kini memanggil
   `await connection()` dan mengekspor `instant = false`; halaman turunannya juga
   `instant = false`.
7. **Logout memakai `scope: "local"`.** Supaya keluar dari satu browser tidak mencabut sesi
   perangkat lain (dan tidak menghapus storage state E2E milik peran lain).
8. **State E2E disimpan di `tests/e2e/.auth/`, bukan `test-results/`.** Playwright menghapus
   direktori output di awal run; flag `E2E_SKIP_GLOBAL_SETUP=1` dapat dipakai untuk
   menggunakan ulang state yang sudah ada.
9. **`loading.tsx` diplih per route group.** Sebelumnya satu `app/dashboard/loading.tsx`
   membungkus semua halaman turunan sehingga skeleton beranda muncul saat membuka detail.
   Halaman beranda dipindah ke `(overview)` dan tiap segmen punya skeleton sendiri.
10. **Skeleton tidak dipakai untuk refetch.** `useApi` mengekspos `refreshing`; komponen
    mempertahankan data lama dan menampilkan `InlineLoading`, agar layar tidak berkedip.
11. **`safeRedirectPath()` memvalidasi `next`.** `new URL("/\\evil.com", origin)` dapat
    melewati pemeriksaan `startsWith("/")`; helper menolak backslash, `%5C`, karakter kontrol,
    dan memverifikasi origin hasil resolusi.
12. **Upload avatar menolak `Content-Length` berlebih sebelum buffering.** Batas 5 MB tetap
    ditegakkan setelah baca, tetapi request yang jelas lebih besar ditolak lebih awal.
13. **CSP mengizinkan kedua origin Midtrans.** `script-src https://*.midtrans.com` berlaku untuk
    sandbox maupun produksi; `'unsafe-eval'` hanya ditambahkan di non-produksi.

### 11.2 Perintah verifikasi

```bash
bun run db:generate
bun run typecheck
bun run lint
bun run test            # unit + API + integrasi (butuh TEST_DATABASE_URL)
bun run test:coverage
bun run build
bun run seed
bun run smoke
bun run test:e2e        # butuh kredensial E2E_*; server harus berjalan
bun run load:test       # uji beban ringan (endpoint publik)
docker compose up -d --build
```

### 11.3 Cakupan QA

**Sudah otomatis**
- Unit: validasi, DTO, error/envelope, rate limit, redirect, peran, waktu, format,
  logger, status sesi, signature webhook, OpenAPI, `apiFetch`, pelaporan error klien.
- Integrasi (database nyata): booking, pembayaran, chat, sesi, time slot, webhook, admin -
  termasuk idempotensi, overlap, IDOR, dan rekonsiliasi Status API.
- Zoom: `ensureZoomMeeting` (idempoten, gagal, retry, truncation) dan integrasi OAuth/API
  dengan `fetch` di-mock.
- E2E Chromium: publik, auth, pasien, konselor, admin, sidebar viewport, Snap (mock),
  serta audit axe WCAG 2.1 A/AA untuk 23 halaman (publik, pasien, konselor, admin).
- Lintas browser: Chromium, Firefox, WebKit, dan Pixel 7 untuk seluruh halaman publik.
- RLS: 12 tabel diuji lewat PostgREST dengan kunci anon (opt-in, lihat di bawah).
- Beban: `bun run load:test` (tanpa dependensi, endpoint publik).
- Gate: typecheck, lint, coverage, build; CI menjalankan semuanya kecuali E2E.

**Belum otomatis (diketahui)**
- E2E di CI tersedia lewat `.github/workflows/e2e.yml` (manual dispatch), tetapi baru
  berjalan setelah secrets `E2E_*` diset di repository.
- Belum ada visual regression test.
- Test Snap di-skip kecuali `E2E_PAYMENT=true`.
- `bun audit` masih melaporkan 2 kerentanan dev-only (`deepmerge`, `minimatch`).
- Login dibatasi 10 percobaan/15 menit per IP. Satu run E2E memakai sekitar 7 login,
  jadi jangan menjalankan suite berulang dalam 15 menit dari IP yang sama.
  Gunakan `E2E_WORKERS=2` saat menargetkan staging untuk mengurangi kontensi.

**Perintah QA tambahan**
```bash
# RLS (butuh project Supabase sungguhan)
RLS_SUPABASE_URL=https://xxx.supabase.co RLS_SUPABASE_ANON_KEY=... \
  bunx vitest run tests/integration/rls.test.ts

# Beban ringan
LOAD_TEST_URL=https://rehat-staging.vercel.app LOAD_TEST_REQUESTS=40 \
  LOAD_TEST_CONCURRENCY=4 bun run load:test
```
