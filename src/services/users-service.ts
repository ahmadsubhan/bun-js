import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

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
