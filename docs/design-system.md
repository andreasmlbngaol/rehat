# Design System REHAT

Dokumen ini menjelaskan fondasi visual dan komponen yang dipakai aplikasi REHAT. Sumber kebenaran tetap ada di kode: token warna di `app/globals.css`, pemuatan font di `app/layout.tsx`, dan komponen di `components/ui/`.

Versi 1.0, 28 November 2026. Pemilik dokumen: UI/UX.

## 1. Prinsip

1. Tenang dan suportif. Palet hijau tanah, latar terang, dan ruang kosong yang cukup supaya halaman tidak terasa penuh.
2. Jelas sebelum dekoratif. Hierarki dibentuk lewat ukuran, berat huruf, dan jarak, bukan lewat warna yang ramai.
3. Satu bahasa untuk tiga peran. Pasien, konselor, dan admin memakai komponen dan pola yang sama.
4. Aksesibel sejak awal. Target WCAG 2.1 AA, bukan perbaikan di akhir.
5. Token dulu. Warna, radius, dan font diambil dari token. Jangan menambah hex baru di komponen.

## 2. Warna

### 2.1 Token semantik terang

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--background` | `#f5f7f5` | Latar halaman |
| `--foreground` | `#203b33` | Teks utama |
| `--card` | `#ffffff` | Kartu, panel, dialog |
| `--primary` | `#203b33` | Tombol utama, aksen kuat |
| `--primary-foreground` | `#ffffff` | Teks di atas primary |
| `--secondary` | `#eaf2ec` | Latar sekunder lembut |
| `--muted` | `#f1f4f1` | Latar netral, skeleton |
| `--muted-foreground` | `#68746d` | Teks pendukung |
| `--accent` | `#eff6f2` | Hover lembut, latar ikon |
| `--accent-foreground` | `#31594d` | Teks aksen, tautan |
| `--destructive` | `#9b3f3f` | Aksi hapus, error |
| `--border` | `#e1e7e1` | Garis pemisah |
| `--input` | `#aab7af` | Garis input |
| `--ring` | `#31594d` | Cincin fokus |
| `--sidebar` | `#ffffff` | Latar sidebar |

Warna hijau tua `#203b33` dipakai untuk teks utama dan tombol utama. Hijau `#31594d` dipakai untuk aksi sekunder dan tautan. Abu hijau `#59645f` dipakai untuk teks sekunder di dalam kartu.

### 2.2 Token semantik gelap

| Token | Nilai |
| --- | --- |
| `--background` | `#0f1a16` |
| `--foreground` | `#f3f6f3` |
| `--card` | `#16241f` |
| `--primary` | `#bbd7cb` |
| `--primary-foreground` | `#0f1a16` |
| `--secondary` | `#1f332b` |
| `--muted` | `#1f2a25` |
| `--muted-foreground` | `#a7b5ac` |
| `--accent` | `#243d33` |
| `--destructive` | `#e07a7a` |
| `--border` | `#2a3a33` |
| `--input` | `#3a4a42` |
| `--ring` | `#bbd7cb` |

Token gelap sudah lengkap, tetapi `ThemeProvider` saat ini memakai `forcedTheme="light"` dan `enableSystem={false}`. Artinya aplikasi selalu tampil terang. Cara mengaktifkannya ada di bagian 9.

### 2.3 Warna status

Warna status dipakai di `Badge` dan `Alert`. Selalu disertai teks atau ikon, jangan mengandalkan warna saja.

| Status | Teks | Latar |
| --- | --- | --- |
| Sukses | `#306242` | `#eaf4ec` |
| Peringatan | `#86651f` | `#f8f0dc` |
| Info | `#496386` | `#edf1f8` |
| Bahaya | `#9b3f3f` | `#faeded` |

### 2.4 Kontras

Angka di bawah dihitung dengan rumus kontras WCAG 2.1.

| Pasangan | Rasio | Nilai minimum |
| --- | --- | --- |
| Teks utama di latar halaman | 11,24:1 | 4,5:1 |
| Teks sekunder di kartu putih | 6,15:1 | 4,5:1 |
| Teks muted di kartu putih | 4,88:1 | 4,5:1 |
| Putih di tombol primary | 12,11:1 | 4,5:1 |
| Teks aksen di latar accent | 7,18:1 | 4,5:1 |
| Teks bahaya di latar bahaya | 5,79:1 | 4,5:1 |
| Teks sukses di latar sukses | 6,32:1 | 4,5:1 |
| Teks peringatan di latar peringatan | 4,75:1 | 4,5:1 |
| Teks info di latar info | 5,43:1 | 4,5:1 |
| Teks utama di latar gelap | 16,35:1 | 4,5:1 |
| Teks muted di kartu gelap | 7,54:1 | 4,5:1 |

### 2.5 Aturan warna

- Jangan menulis hex baru di komponen. Kalau butuh varian, tambahkan token di `app/globals.css`.
- Warna hijau tidak dipakai untuk menandai error. Error selalu memakai `destructive`.
- Warna status harus punya pasangan teks yang kontras, termasuk di dark mode.
- Gradien tidak dipakai. Bayangan hanya satu tingkat, yaitu bayangan dialog.

## 3. Tipografi

### 3.1 Keluarga font

| Font | Variabel | Berat | Pemakaian |
| --- | --- | --- | --- |
| Inter | `--font-inter` | 400, 500, 600, 700 | Teks UI, body, tombol, tabel |
| Newsreader | `--font-newsreader` | 400, 500, italic | Headline pemasaran, kutipan |
| Geist Mono | `--font-geist-mono` | 400 | Kode, ID teknis, angka monospace |

Font dimuat lewat `next/font/google` dengan `display: swap`. Body memakai Inter. `font-heading` memakai Newsreader dan hanya untuk headline, bukan untuk isi form atau tabel.

### 3.2 Skala tipografi

| Peran | Ukuran | Line height | Berat | Font | Contoh |
| --- | --- | --- | --- | --- | --- |
| Hero | 44px, 64px di desktop | 1,02 / 64px | 500 | Newsreader | Landing page |
| Judul section | 34px, 40px di desktop | 1,12 / 44,8px | 400 | Newsreader | Section landing |
| Judul halaman | 26px | 36,4px | 600 | Inter | `PageHeader` |
| Judul kartu | 16px | 26px | 600 | Inter | `CardTitle` |
| Body | 13px sampai 14px | 20px | 400 | Inter | Paragraf |
| Teks UI | 12px | 19,2px | 400 atau 500 | Inter | Tabel, form, deskripsi |
| Tombol | 13px | 18px | 600 | Inter | `Button` |
| Caption | 11px | 18px | 400 | Inter | Teks bantuan |
| Eyebrow | 12px | 19,2px | 600, tracking 1,4px, uppercase | Inter | `PageHeader` |

### 3.3 Aturan tipografi

- Ukuran teks terkecil 10px hanya untuk metadata seperti jam pesan. Teks UI utama memakai 12px.
- Tracking negatif hanya untuk ukuran besar: judul halaman -0,7px, hero -1,6px sampai -2,3px.
- Jangan memakai lebih dari dua keluarga font dalam satu layar.
- Angka nominal uang dan tanggal memakai font sans, bukan heading.

## 4. Spacing, radius, dan elevasi

### 4.1 Spacing

Skala dasar 4px. Nilai yang dipakai: 4, 8, 12, 16, 20, 24, 32, 40, 48.

| Area | Nilai |
| --- | --- |
| Padding halaman dashboard | 20px, 32px di tablet, 38px di desktop |
| Padding kartu | 22px |
| Padding dialog | 27px |
| Jarak antar field form | 16px |
| Jarak antar kartu | 16px |
| Lebar sidebar | 234px |
| Tinggi topbar | 79px |
| Lebar maksimum konten | 1206px |

### 4.2 Radius

Token radius dasar 12px, lalu diturunkan dengan pengali.

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--radius-sm` | 7,2px | Elemen kecil |
| `--radius-md` | 9,6px | Input, select |
| `--radius-lg` | 12px | Kartu, panel |
| `--radius-xl` | 16,8px | Dialog, container besar |
| `--radius-2xl` | 21,6px | Panel besar |
| `--radius-3xl` | 26,4px | Blok dekoratif |
| `--radius-4xl` | 31,2px | Blok dekoratif |

Nilai praktis yang sudah dipakai: 5px sampai 6px untuk badge dan tombol ikon kecil, 8px sampai 10px untuk tombol dan input, 12px untuk kartu, 17px untuk dialog, dan `rounded-full` untuk avatar dan pil.

### 4.3 Elevasi

- Kartu memakai border 1px `--border`, tanpa bayangan.
- Dialog memakai bayangan `0 20px 80px rgba(32, 59, 51, 0.18)`.
- Overlay dialog memakai `#0f1a16` dengan opasitas 30% dan blur 2px.
- Popover memakai `shadow-lg` dan border 1px.
- Sidebar dan topbar tidak memakai bayangan, hanya border.

### 4.4 Motion

- Transisi warna memakai `transition-colors` 150ms.
- Dialog masuk dan keluar 100ms dengan fade dan zoom 95%.
- Navigation progress 1,1 detik, berulang selama navigasi.
- Animasi berulang seperti spinner, skeleton, dan navigation progress memakai `motion-reduce:animate-none` agar menghormati `prefers-reduced-motion`.

## 5. Ikon

- Ikon utama memakai Phosphor Icons dari `@phosphor-icons/react/dist/ssr`.
- Ukuran default 16px (`size-4`) di dalam tombol, 20px sampai 24px untuk navigasi dan ilustrasi kecil.
- Ikon brand dan ilustrasi khusus ada di `components/ui/figma-icons.tsx`.
- Ikon dekoratif diberi `aria-hidden`. Ikon yang menjadi satu-satunya label tombol harus punya `aria-label`.
- Jangan mencampur Phosphor dan Lucide dalam satu komponen.

## 6. Komponen

### 6.1 Button

File: `components/ui/button.tsx`

| Varian | Pemakaian |
| --- | --- |
| `default` | Aksi utama, satu per layar atau per dialog |
| `outline` | Aksi sekunder |
| `secondary` | Aksi netral dengan latar lembut |
| `ghost` | Aksi di toolbar atau item menu |
| `destructive` | Hapus atau tindakan berbahaya |
| `link` | Navigasi berbentuk teks |

Ukuran: `xs` 28px, `sm` 36px, `default` 43px, `lg` 50px, `icon` 44px, `icon-xs` 28px, `icon-sm` 36px, `icon-lg` 48px.

State: hover menggelap atau memakai latar muted, focus memakai ring 3px `ring/20`, disabled memakai opasitas 50% dan kursor `not-allowed`. Tombol dengan ikon memakai gap 8px.

### 6.2 Input, Select, Textarea, Label

- Input: tinggi 48px, radius 9px, border `#aab7af`, fokus ring 2px, `aria-invalid` memakai border dan ring merah.
- Select: tinggi 44px, radius 9px, memakai chevron kanan, native select agar tetap aksesibel.
- Textarea: radius dan border sama dengan input, tinggi minimum 120px.
- Label: 14px, weight 500, warna `#344b40`, selalu terhubung ke input lewat `htmlFor`.
- Placeholder memakai `#68746d` dan tidak boleh menggantikan label.

### 6.3 Badge

File: `components/ui/badge.tsx`

Tinggi 28px, radius 5px, teks 12px. Varian: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`. Badge dipakai untuk status, bukan untuk aksi. Teks badge harus tetap terbaca tanpa warna.

### 6.4 Card

File: `components/ui/card.tsx`

Radius 12px, border 1px, padding 22px, latar putih. `CardTitle` 16px semibold, `CardDescription` 12px. Kartu tidak memakai bayangan.

### 6.5 Dialog

File: `components/ui/dialog.tsx`

Lebar maksimum `max-w-md`, radius 17px, padding 27px, overlay gelap dengan blur. Dipakai untuk form tambah atau edit dan konfirmasi hapus. Fokus otomatis masuk ke dialog, Escape menutup, dan fokus kembali ke pemicu setelah ditutup.

### 6.6 Alert

File: `components/ui/alert.tsx`

Varian `info`, `success`, `warning`, `destructive`. Memakai `role="alert"`, ikon 16px, radius 10px, padding 16px. Dipakai untuk pesan error form dan informasi penting di dalam halaman.

### 6.7 EmptyState

File: `components/ui/empty-state.tsx`

Kartu dengan border, ikon opsional di lingkaran accent, judul 16px, deskripsi 12px, dan satu aksi. Dipakai saat daftar kosong, misalnya belum ada konselor atau belum ada jadwal. Jangan membiarkan layar kosong tanpa penjelasan.

### 6.8 Pagination

File: `components/ui/pagination.tsx`

Dipakai di daftar yang panjang. Menampilkan teks "Halaman X dari Y · N data" di kiri dan dua tombol, Sebelumnya dan Berikutnya, di kanan. Tombol memakai varian outline ukuran sm (36px) dan otomatis nonaktif di halaman pertama atau terakhir. Jika hanya ada satu halaman, komponen hanya menampilkan jumlah data.

### 6.9 Loading dan Skeleton

File: `components/ui/loading-state.tsx`, `components/ui/page-skeleton.tsx`, `components/ui/skeleton.tsx`

- `ListSkeleton` untuk memuat daftar.
- `InlineLoading` untuk refresh kecil di samping judul.
- Spinner 14px sampai 28px dengan `motion-reduce:animate-none`.
- Skeleton memakai `bg-muted` dan `animate-pulse`.

### 6.10 Toast

Memakai Sonner di `components/ui/sonner.tsx`, posisi `top-center`, warna status aktif. Dipakai untuk konfirmasi singkat setelah aksi berhasil atau gagal.

### 6.11 Table

File: `components/ui/table.tsx`

Header memakai latar `#fafbf8`, teks 12px medium uppercase dengan tracking 0,5px, dan tinggi 52px. Sel memakai teks 12px `#59645f` dengan padding 20px. Baris dipisahkan border bawah. Tabel dibungkus container yang bisa digulir horizontal di layar kecil, jadi tabel tidak memaksa halaman melebar.

### 6.12 Avatar

File: `components/ui/avatar.tsx`

Bentuk lingkaran, ukuran 32px, 40px, 56px, dan 80px, fallback memakai inisial nama. Avatar yang diunggah memakai rasio 1:1 dan format PNG, JPG, atau WebP.

### 6.13 PageHeader

File: `components/ui/page-header.tsx`

Susunan standar halaman dashboard: eyebrow opsional, judul 26px, deskripsi 12px, tanggal hari ini, dan slot aksi di kanan. Halaman dashboard memakai komponen ini supaya posisi judul dan aksi konsisten.

### 6.14 TodayBadge

File: `components/ui/today-badge.tsx`

Pil kecil berisi tanggal hari ini dalam zona waktu Asia/Jakarta. Dipakai di header halaman dashboard.

## 7. Pola halaman

### 7.1 Halaman publik

Hero memakai Newsreader 44px sampai 64px, satu tombol utama dan satu tautan sekunder. Section memakai judul 34px sampai 40px, kartu dengan latar lembut, dan ilustrasi garis. Halaman publik tidak memakai sidebar.

### 7.2 Autentikasi

Tata letak terbagi dua: panel ilustrasi 550px di kiri, form di kanan dengan lebar maksimum 410px, di dalam container 1200px. Panel ilustrasi hanya tampil di desktop. Judul form memakai Newsreader 32px, 37px di layar lebih besar. Form memakai tombol utama selebar form, ditambah opsi masuk dengan Google pada ukuran yang sama. Error memakai `Alert` destructive.

### 7.3 Dashboard

Sidebar 234px di kiri, topbar 79px, konten maksimum 1206px. Halaman daftar dan ringkasan dimulai dengan `PageHeader`, lalu filter, lalu daftar atau kartu. Aksi utama berada di kanan header.

### 7.4 Daftar dengan filter

Filter berada dalam satu baris di atas daftar. Tanggal memakai field tanggal, konselor memakai select. Jika filter aktif, tampilkan tombol reset. Daftar kosong memakai `EmptyState`, bukan teks kosong.

### 7.5 Form di dialog

Form tambah dan edit memakai dialog, bukan halaman baru. Field disusun vertikal dengan jarak 16px, label di atas, pesan error di bawah field. Tombol batal memakai outline, tombol simpan memakai default. Setelah berhasil, dialog ditutup dan daftar dimuat ulang.

### 7.6 Ruang sesi

Ruang chat memakai satu kartu dengan daftar pesan yang dapat digulir, tinggi maksimum 26rem, dan composer di bawah. Pesan sendiri rata kanan dengan latar primary, pesan lawan bicara rata kiri dengan latar muted dan avatar. Nama pengirim hanya muncul di pesan lawan bicara. Jika sesi belum dimulai atau sudah selesai, tampilkan `Alert` di atas daftar pesan. Tombol muat pesan sebelumnya muncul saat masih ada riwayat lama.

### 7.7 State

Setiap daftar wajib punya empat state: memuat, kosong, error, dan berisi. Setiap aksi yang memakan waktu wajib menampilkan status loading di tombol atau di dekat aksi.

## 8. Aksesibilitas

Target: WCAG 2.1 level A dan AA. Pengujian otomatis memakai axe dengan tag `wcag2a`, `wcag2aa`, `wcag21a`, dan `wcag21aa` di `tests/e2e/a11y.spec.ts`.

- Target kontras teks normal minimal 4,5:1. Pasangan inti di bagian 2.4 sudah memenuhi.
- Fokus selalu terlihat. Tombol memakai ring 3px, input memakai ring 2px.
- Semua kontrol dapat dijangkau keyboard. Dialog dan popover memakai Radix sehingga fokus terperangkap dan Escape berfungsi.
- Target sentuh utama memakai tinggi 43px sampai 48px. Tombol ukuran sm (36px) hanya untuk aksi sekunder di dalam baris, bukan aksi utama.
- Input yang tidak valid memakai `aria-invalid`, dan pesan error ditampilkan di dekat field dengan `Alert` yang memakai `role="alert"`.
- Ikon dekoratif memakai `aria-hidden`. Tombol ikon wajib punya `aria-label`.
- Bahasa halaman `lang="id"`.
- Animasi berulang memakai `motion-reduce:animate-none`.
- Jangan menyampaikan status hanya lewat warna. Badge dan Alert selalu punya teks.

## 9. Dark mode

Token gelap sudah didefinisikan di `app/globals.css`, tetapi belum aktif karena `components/providers/theme-provider.tsx` memakai `forcedTheme="light"`.

Untuk mengaktifkan:

1. Hapus `forcedTheme="light"`.
2. Ubah `enableSystem` menjadi `true` jika ingin mengikuti pengaturan sistem.
3. Tampilkan `ThemeToggle` di topbar.
4. Uji ulang kontras di semua halaman, terutama badge, alert, chart, dan tombol destructive.
5. Jalankan `tests/e2e/a11y.spec.ts` dalam mode gelap.

Sampai langkah itu selesai, semua desain baru harus diuji dalam mode terang.

## 10. Pemeliharaan

- Perubahan token dilakukan di `app/globals.css`, bukan di komponen.
- Komponen baru masuk ke `components/ui/` dan memakai `cn` serta `cva` seperti komponen yang sudah ada.
- Setiap komponen baru wajib punya state default, hover, focus, disabled, dan error jika relevan.
- Dokumen ini diperbarui saat token, tipografi, atau komponen berubah.
- Review desain dilakukan oleh UI/UX sebelum merge.
