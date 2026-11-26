# REHAT

REHAT adalah platform konseling daring yang menghubungkan pasien dengan konselor profesional
melalui sesi **chat** dan **Zoom**. Aplikasi mencakup pemesanan jadwal, pembayaran daring,
ruang sesi realtime, serta dashboard terpisah untuk pasien, konselor, dan admin.

> Proyek ini dikembangkan sebagai tugas kelompok. Dokumen kebutuhan lengkap tersedia di
> `docs/SRS Kelompok 5.pdf`.

## Fitur

### Pasien

- Registrasi, verifikasi email, login, dan pemulihan kata sandi.
- Melihat katalog layanan dan konselor, termasuk jadwal yang tersedia.
- Memesan sesi konseling dan membayar melalui Midtrans Snap.
- Mengikuti sesi chat realtime dan bergabung ke rapat Zoom.
- Melihat riwayat pemesanan, status pembayaran, dan sesi.
- Mengelola profil dan foto avatar.

### Konselor

- Melihat ringkasan sesi dan pemesanan yang masuk.
- Mengatur jadwal ketersediaan (time slot).
- Mengelola profil profesional dan layanan yang ditawarkan.
- Mengikuti sesi chat dan Zoom dengan pasien.

### Admin

- Ringkasan statistik platform.
- Mengelola pengguna, konselor, layanan, dan jadwal.
- Memantau pemesanan, pembayaran, dan sesi.
- Menangani retry pembuatan rapat Zoom yang gagal.

### Umum

- Antarmuka responsif dengan mode terang/gelap.
- Dokumentasi OpenAPI interaktif di `/docs`.
- Health check di `/api/v1/health`, `/api/v1/health/live`, dan `/api/v1/health/ready`.
- Audit aksesibilitas WCAG 2.1 AA dan pengujian lintas browser.

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16.4.5 (App Router, Turbopack) |
| Bahasa | TypeScript 5.9.3 (strict) |
| Runtime & package manager | Bun 1.4.3 |
| UI | React 19.3.1, Tailwind CSS 4, shadcn/ui, Radix UI, Lucide |
| Database | Supabase PostgreSQL 17 |
| ORM | Prisma 7.10.1 (`prisma-client` + `@prisma/adapter-pg`) |
| Autentikasi | Supabase Auth (`@supabase/ssr`) |
| Pembayaran | Midtrans Snap (sandbox) |
| Video | Zoom Server-to-Server OAuth |
| Email | Resend |
| Penyimpanan | Cloudflare R2 |
| Validasi | Zod 4 |
| Unit & integration test | Vitest 5 |
| E2E & accessibility test | Playwright 1.65 + `@axe-core/playwright` |
| Deployment | Vercel |

## Struktur Proyek

```text
app/
  (public)/          Halaman publik: beranda, layanan, konselor, FAQ, legal, auth
  dashboard/         Area pasien
  counselor/         Area konselor
  admin/             Area admin
  api/v1/            Route Handlers REST
  api/cron/          Pekerjaan terjadwal
  api/docs/          Dokumen OpenAPI (JSON)
  docs/              Swagger UI
components/
  ui/                Komponen dasar (shadcn/ui)
  layout/            Header, footer, sidebar, navigasi
  auth/              Komponen form autentikasi
  profile/           Form profil
  schedule/          Pengelola jadwal konselor
  session/           Daftar dan ruang sesi
lib/
  api/               Envelope respons, error, validasi, rate limit, client
  auth/              Session, guard, redirect, role
  dto/               Pemetaan data ke bentuk publik
  integrations/      Midtrans, Zoom, Resend, R2
  services/          Logika bisnis
  supabase/          Client server, browser, dan admin
  validation/        Skema Zod
prisma/
  schema.prisma      Model data
  migrations/        Migrasi database
  sql/               Trigger dan kebijakan RLS Supabase
  seed.ts            Data awal
tests/
  unit/              Pengujian unit
  api/               Pengujian Route Handler
  integration/       Pengujian dengan database
  e2e/               Pengujian end-to-end dan aksesibilitas
```

## Menjalankan Secara Lokal

### Prasyarat

- Bun 1.4.3 atau lebih baru
- PostgreSQL 17 (lokal atau Supabase)
- Kredensial Supabase, Midtrans sandbox, Zoom, Resend, dan Cloudflare R2

### 1. Instalasi

```bash
git clone <url-repository> rehat
cd rehat
bun install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Isi seluruh variabel di `.env`. Penjelasan singkat:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL/Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server saja) |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans sandbox |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key Midtrans sandbox |
| `ZOOM_*` | Kredensial Server-to-Server OAuth |
| `RESEND_API_KEY` | API key Resend |
| `R2_*` | Kredensial Cloudflare R2 |
| `CRON_SECRET` | Bearer token untuk endpoint cron |
| `TEST_DATABASE_URL` | Database khusus integration test |
| `E2E_*` | Akun dan URL untuk pengujian Playwright |

### 3. Database

```bash
bun run db:generate     # generate Prisma Client
bun run db:migrate      # jalankan migrasi
bun run db:sql          # trigger auth + kebijakan RLS Supabase
bun run seed            # data awal (admin, konselor, layanan)
```

### 4. Jalankan aplikasi

```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000). Dokumentasi API tersedia di
[http://localhost:3000/docs](http://localhost:3000/docs).

## Perintah

| Perintah | Keterangan |
| --- | --- |
| `bun run dev` | Menjalankan server pengembangan |
| `bun run build` | Generate Prisma, OpenAPI, aset Swagger, lalu build produksi |
| `bun run start` | Menjalankan hasil build |
| `bun run lint` | ESLint |
| `bun run typecheck` | Pemeriksaan tipe TypeScript |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Migrasi database (development) |
| `bun run db:deploy` | Migrasi database (production) |
| `bun run db:sql` | Terapkan trigger dan RLS Supabase |
| `bun run db:studio` | Prisma Studio |
| `bun run seed` | Seed data awal |
| `bun run openapi` | Generate `public/openapi.json` |
| `bun run swagger:assets` | Salin aset Swagger UI |
| `bun run smoke` | Smoke test end-to-end terhadap server berjalan |
| `bun run cron:expire` | Memicu cron kedaluwarsa pemesanan secara manual |
| `bun run load:test` | Load test sederhana terhadap URL tertentu |

## Pengujian

```bash
bun run test              # unit, API, dan integration
bun run test:unit         # unit + API
bun run test:integration  # integration (butuh TEST_DATABASE_URL)
bun run test:coverage     # laporan cakupan
bun run test:e2e          # Playwright (butuh aplikasi berjalan)
```

Panduan singkat:

- Integration test memakai database terpisah. Nama database wajib mengandung `test`.
- E2E memakai akun dari variabel `E2E_*`. Jika variabel kosong, test yang membutuhkan akun
  akan dilewati.
- Login dibatasi 10 permintaan per 15 menit per IP. Hindari menjalankan ulang suite E2E
  berkali-kali dari IP yang sama; gunakan `E2E_SKIP_GLOBAL_SETUP=1` untuk memakai ulang
  state login di `tests/e2e/.auth`.

## Dokumentasi API

- Spesifikasi OpenAPI: `GET /api/docs`
- Swagger UI: `/docs`
- Sumber kontrak: `lib/openapi/registry.ts`

## Deployment

Aplikasi dirancang untuk Vercel:

1. Hubungkan repository ke project Vercel.
2. Salin seluruh variabel environment ke dashboard Vercel.
3. Jalankan `bun run db:deploy` dan `bun run db:sql` pada database produksi.
4. Deploy. Konfigurasi cron berada di `vercel.json`.

Endpoint cron `GET /api/cron/expire-bookings` membutuhkan header
`Authorization: Bearer <CRON_SECRET>`.

## Tim

| Peran | Tanggung jawab |
| --- | --- |
| Backend & Tech Lead | API, database, integrasi, CI/CD, deployment |
| Frontend | Halaman publik, area pasien, konselor, dan admin |
| QA | Unit, API, integration, E2E, aksesibilitas, dan keamanan |
| UI/UX | Riset dan desain antarmuka (Figma) |
| Project Manager | SRS, rencana proyek, dokumen legal, dan README |

## Lisensi

Proyek ini dibuat untuk keperluan akademik.
