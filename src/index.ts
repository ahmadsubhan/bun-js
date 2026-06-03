import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";
import { swagger } from "@elysiajs/swagger";

export const app = new Elysia()
  .use(swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "Bun Elysia API Documentation",
        version: "1.0.0",
        description: "Dokumentasi interaktif REST API menggunakan Swagger UI."
      },
      tags: [
        { name: "Users", description: "Endpoint terkait autentikasi dan manajemen pengguna" },
        { name: "General", description: "Endpoint umum" }
      ]
    }
  }))
  .get("/", () => {
    return {
      message: "Hello World from Elysia, Bun & Drizzle!",
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ["General"],
      summary: "Endpoint selamat datang",
      description: "Menampilkan pesan sambutan dari framework Elysia, Bun, dan Drizzle."
    }
  })
  .get("/users", async () => {
    try {
      // Query sederhana untuk mengecek koneksi database
      const allUsers = await db.select().from(users);
      return {
        success: true,
        data: allUsers
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to connect to database or query users. Make sure MySQL is running.",
        error: error.message
      };
    }
  }, {
    detail: {
      tags: ["General"],
      summary: "Mengambil semua pengguna (Pengecekan DB)",
      description: "Mengambil daftar semua pengguna dari database untuk memverifikasi koneksi database."
    }
  })
  .use(usersRoute);

if (import.meta.main) {
  app.listen(process.env.PORT || 3000);
  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}
