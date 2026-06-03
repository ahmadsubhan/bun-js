import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini memvalidasi apakah email sudah terdaftar, melakukan hash password,
 * menyimpan pengguna baru ke database, dan mengembalikan data profil pengguna yang berhasil didaftarkan.
 */
export async function registerUser(data: { name: string; email: string; password: string }) {
  const { name, email, password } = data;

  // 1. Cek apakah email sudah terdaftar
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUsers.length > 0) {
    return {
      success: false,
      code: "USER_EXISTS",
      message: "User already exists",
    };
  }

  // 2. Hash password menggunakan Bun.password (dengan algoritma bcrypt)
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Simpan data user ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // 4. Ambil data user yang baru saja dibuat
  const [newUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!newUser) {
    return {
      success: false,
      code: "INSERT_FAILED",
      message: "Failed to create user",
    };
  }

  // 5. Hilangkan field password sebelum mengembalikan data
  const { password: _, ...userData } = newUser;

  return {
    success: true,
    message: "User created successfully",
    data: userData,
  };
}

/**
 * Melakukan autentikasi/login pengguna.
 * Fungsi ini memverifikasi email dan password pengguna, membuat token sesi baru (UUID),
 * menyimpan sesi tersebut ke database, dan mengembalikan informasi pengguna beserta token loginnya.
 */
export async function loginUser(data: { email: string; password: string }) {
  const { email, password } = data;

  // 1. Cari user berdasarkan email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Email atau Password salah",
    };
  }

  // 2. Verifikasi password dengan hash di DB
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Email atau Password salah",
    };
  }

  // 3. Buat token session UUID
  const token = crypto.randomUUID();

  // 4. Simpan session ke database
  await db.insert(sessions).values({
    token,
    user_id: user.id,
  });

  // 5. Kembalikan data user beserta token (tanpa password)
  const { password: _, ...userData } = user;

  return {
    success: true,
    message: "User login successfully",
    data: {
      ...userData,
      token,
    },
  };
}

/**
 * Mengambil informasi detail pengguna yang sedang masuk (login) berdasarkan token sesi.
 * Fungsi ini mencocokkan token sesi pada tabel sessions dengan data pengguna pada tabel users.
 */
export async function getCurrentUser(token: string) {
  const [result] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  return {
    success: true,
    message: "User fetched successfully",
    data: result,
  };
}

/**
 * Mengeluarkan pengguna (logout) dari sistem.
 * Fungsi ini menghapus token sesi yang bersangkutan dari database sessions untuk mengakhiri sesi aktif.
 */
export async function logoutUser(token: string) {
  const [resultHeader] = await db
    .delete(sessions)
    .where(eq(sessions.token, token));

  if (!resultHeader || resultHeader.affectedRows === 0) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  return {
    success: true,
    message: "User logout successfully",
    data: "OK",
  };
}



