# BunJS Elysia REST API

Aplikasi backend berbasis REST API yang dibangun menggunakan **Bun.js** dan **ElysiaJS**. Aplikasi ini menyediakan fitur manajemen pengguna dasar (Registrasi, Login, Autentikasi Current User, dan Logout) menggunakan token session yang disimpan ke database relasional.

## Teknologi dan Library yang Digunakan

- **[Bun.js](https://bun.sh/)**: Runtime JavaScript yang cepat, package manager, bundler, sekaligus framework testing bawaan.
- **[ElysiaJS](https://elysiajs.com/)**: Web framework berkinerja tinggi untuk ekosistem Bun, yang menawarkan validasi payload dan pengetikan end-to-end secara otomatis menggunakan Typebox.
- **[Drizzle ORM](https://orm.drizzle.team/)**: TypeScript ORM modern yang memberikan keamanan tipe (type-safety) dan performa yang efisien untuk SQL database.
- **[MySQL2](https://www.npmjs.com/package/mysql2)**: Driver database murni JavaScript untuk MySQL.
- **`bun:test`**: Fitur unit test super-cepat bawaan dari Bun.

---

## Arsitektur dan Struktur Direktori

Aplikasi ini menggunakan pendekatan arsitektur berlapis (layered architecture) sederhana untuk memisahkan route layer (yang bertugas menangani request dan validasi HTTP) dengan service layer (yang memproses alur logika bisnis dan interaksi dengan database).

```text
bunjs/
├── src/
│   ├── index.ts              # Entry point aplikasi & inisialisasi server Elysia
│   ├── db/
│   │   ├── index.ts          # Konfigurasi koneksi pool database (MySQL)
│   │   └── schema.ts         # Definisi tabel Drizzle ORM
│   ├── routes/
│   │   └── users-route.ts    # Rute HTTP (Elysia endpoints) dan skema validasinya (Typebox)
│   └── services/
│       └── users-service.ts  # Logika bisnis (proses registrasi, autentikasi, dan query Drizzle)
├── tests/
│   └── users.test.ts         # Kumpulan unit test otomatis
├── .env                      # File variabel lingkungan lokal (kredensial database & port)
├── package.json              # Daftar depedensi dan npm/bun scripts
├── drizzle.config.ts         # Konfigurasi migrasi Drizzle Kit
└── README.md                 # Dokumentasi dari proyek ini
```

### Konvensi Penamaan (Naming Conventions)
- **Direktori**: Menggunakan gaya `kebab-case` jika diperlukan, nama menggunakan huruf kecil yang jamak (`routes`, `services`, `tests`).
- **Berkas Kode Sumber**: Menggunakan `kebab-case` yang menjelaskan cakupan atau perannya secara eksplisit (contoh: `users-route.ts`, `users-service.ts`).
- **Berkas Pengujian**: Menggunakan akhiran `*.test.ts` sehingga mudah dieksekusi oleh test runner.
- **Kode Internal (Fungsi/Variabel)**: Menggunakan `camelCase` (contoh: `loginUser`, `usersRoute`, `getCurrentUser`).

---

## Skema Database

Aplikasi menggunakan database relasional (MySQL) yang terdiri dari dua tabel inti:

### 1. `users`
Tabel untuk menyimpan data profil dan autentikasi pengguna.
- `id` (INT): Primary Key, Auto Increment.
- `name` (VARCHAR 255): Not Null.
- `email` (VARCHAR 255): Not Null, bersifat Unik.
- `password` (VARCHAR 255): Not Null (Disimpan dalam bentuk teks acak/hash dengan algoritma bcrypt).
- `created_at` (TIMESTAMP): Otomatis mencatat waktu pembuatan.
- `updated_at` (TIMESTAMP): Otomatis mencatat waktu saat terjadi update.

### 2. `sessions`
Tabel untuk mengelola token log sesi login pengguna.
- `id` (INT): Primary Key, Auto Increment.
- `token` (VARCHAR 255): Not Null (Memanfaatkan fungsi UUID).
- `user_id` (BIGINT): Not Null, berperan sebagai *Foreign Key* yang merujuk pada `users(id)` dengan opsi ON DELETE CASCADE.
- `created_at` (TIMESTAMP): Otomatis mencatat waktu sesi diterbitkan.

---

## Daftar API Endpoint yang Tersedia

*Catatan: Semua API menggunakan prefix `/api` di awal endpoint.*

| HTTP Method | Endpoint | Deskripsi Fungsi | Autentikasi Headers | Body Payload yang Dibutuhkan |
|-------------|----------|------------------|---------------------|------------------------------|
| **POST** | `/api/users` | Mendaftarkan akun user baru. | *(Tidak diperlukan)* | `{"name": "...", "email": "...", "password": "..."}` |
| **POST** | `/api/users/login` | Memvalidasi login user dan menerbitkan session token. | *(Tidak diperlukan)* | `{"email": "...", "password": "..."}` |
| **GET** | `/api/users/current` | Mengambil data profil user yang saat ini sedang aktif (login). | `Authorization: Bearer <token>` | *(Tidak diperlukan)* |
| **POST** | `/api/users/logout` | Mencabut/memusnahkan sesi token user aktif. | `Authorization: Bearer <token>` | *(Tidak diperlukan)* |

*Kesalahan Validasi pada endpoint akan dikelola secara elegan oleh Elysia dengan balasan HTTP `422 Unprocessable Entity` atau `400 Bad Request`.*

---

## Cara Setup Project (Lokal)

Ikuti langkah-langkah di bawah ini untuk mempersiapkan environment aplikasi Anda.

1. **Unduh repositori dan install dependency**
   Gunakan Bun untuk memasang seluruh paket secara kilat:
   ```bash
   bun install
   ```

2. **Pengaturan `.env`**
   Salin dari `.env.example` ke sebuah berkas `.env` baru. Perbarui isian koneksi database disesuaikan dengan MySQL server Anda.
   ```env
   # Contoh isi file .env:
   DATABASE_URL="mysql://root:password@localhost:3306/bun_elysia_db"
   PORT=3005
   ```

3. **Inisialisasi & Sinkronisasi Skema Database**
   Pastikan service MySQL Anda berjalan, kemudian lakukan sinkronisasi skema ke database untuk menciptakan tabel secara otomatis:
   ```bash
   bun run db:generate
   bun run db:push
   ```

---

## Cara Menjalankan Aplikasi

Anda dapat menggunakan script `dev` yang akan memuat ulang server secara otomatis bila mendeteksi perubahan pada file TypeScript.

```bash
bun run dev
```

Jika sukses, terminal akan memunculkan tulisan seperti `🦊 Elysia is running at http://localhost:3005`.

---

## Cara Menguji Aplikasi (Unit Test)

Repositori ini telah dibekali dengan **17+ Skenario Pengujian Unit Test Komprehensif** (Mencakup tes format keliru, tes batas karakter panjang, pengulangan email, invalid token, dsb) secara E2E terhadap layer HTTP.

> **PENTING**: Semua test case akan otomatis **membersihkan** isi dari tabel `sessions` dan `users` sebelum setiap test case berjalan untuk menjaga konsistensi.

Jalankan pengujian menggunakan:
```bash
bun test
```

Anda juga bisa menjalankan satu file pengujian tertentu atau mengawasi perubahan layaknya watch mode:
```bash
bun test --watch
```
