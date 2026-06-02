# Setup Backend API dengan Bun, Elysia, dan Drizzle

## Deskripsi Tugas
Tugas ini bertujuan untuk melakukan inisialisasi awal pada proyek backend menggunakan ekosistem Bun.js, dengan ElysiaJS sebagai framework web dan Drizzle sebagai ORM untuk database MySQL. Instruksi di bawah ini merupakan panduan tingkat tinggi (high-level) untuk diimplementasikan.

## Langkah-langkah Implementasi

1. **Inisialisasi Proyek Bun:**
   - Lakukan inisialisasi proyek baru di dalam folder ini menggunakan perintah `bun init` atau yang serupa.
   - Pastikan konfigurasi dasar seperti `package.json` dan `tsconfig.json` sudah terbentuk.

2. **Instalasi Dependencies:**
   - Install **ElysiaJS** sebagai framework web utama.
   - Install **Drizzle ORM** beserta driver **MySQL** yang sesuai (seperti `mysql2`).
   - Install **Drizzle Kit** (sebagai dev dependency) untuk keperluan manajemen migrasi database.

3. **Konfigurasi Database (Drizzle & MySQL):**
   - Siapkan koneksi database MySQL menggunakan instance Drizzle. Disarankan membaca variabel koneksi dari file `.env`.
   - Buat sebuah file schema sederhana untuk Drizzle MySQL (misalnya definisi tabel `users`).
   - Tambahkan file konfigurasi `drizzle.config.ts` agar Drizzle Kit dapat membaca schema yang dibuat.

4. **Konfigurasi Server (ElysiaJS):**
   - Buat file entry point aplikasi (misal: `src/index.ts`).
   - Inisialisasi aplikasi ElysiaJS dan jalankan server pada port tertentu.
   - Buat satu endpoint dasar (contoh: `GET /`) untuk memastikan server berjalan dengan baik.

5. **Penambahan Scripts:**
   - Tambahkan script di `package.json` untuk menjalankan server dalam mode development (menggunakan fitur hot reload/watch dari Bun).
   - Tambahkan script untuk mempermudah eksekusi Drizzle Kit (generate dan push migrasi).

## Kriteria Penerimaan (Acceptance Criteria)
- Proyek dapat dijalankan menggunakan perintah script dari `package.json` menggunakan runtime Bun.
- Aplikasi merespon tanpa error saat endpoint diakses.
- Struktur proyek jelas, dengan pemisahan antara konfigurasi server dan konfigurasi database/schema.
- Tidak ada error kompilasi TypeScript terkait setup Elysia maupun Drizzle.
