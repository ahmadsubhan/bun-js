import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .get("/", () => {
    return {
      message: "Hello World from Elysia, Bun & Drizzle!",
      timestamp: new Date().toISOString()
    };
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
  })
  .use(usersRoute);

if (import.meta.main) {
  app.listen(process.env.PORT || 3000);
  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}
