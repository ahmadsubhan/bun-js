import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    const result = await registerUser(body);
    
    if (!result.success) {
      if (result.code === "USER_EXISTS") {
        set.status = 400; // Bisa juga 409 Conflict, sesuai petunjuk kita set 400/409. 400 adalah standar Bad Request.
      } else {
        set.status = 400;
      }
      return {
        success: false,
        message: result.message,
      };
    }
    
    set.status = 201; // Created
    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 255 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    }),
    response: {
      201: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Nullable(t.Any()),
          updated_at: t.Nullable(t.Any())
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        message: t.String()
      })
    },
    detail: {
      tags: ["Users"],
      summary: "Registrasi Pengguna Baru",
      description: "Mendaftarkan pengguna baru ke database dan mengembalikan detail profil tanpa password."
    }
  })
  .post("/users/login", async ({ body, set }) => {
    const result = await loginUser(body);
    
    if (!result.success) {
      set.status = 401; // Unauthorized
      return {
        success: false,
        message: result.message,
      };
    }
    
    set.status = 200; // OK
    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Nullable(t.Any()),
          updated_at: t.Nullable(t.Any()),
          token: t.String()
        })
      }),
      401: t.Object({
        success: t.Boolean(),
        message: t.String()
      })
    },
    detail: {
      tags: ["Users"],
      summary: "Login Pengguna",
      description: "Melakukan autentikasi menggunakan email dan password, lalu menghasilkan token sesi."
    }
  })
  .guard({
    beforeHandle({ headers, set }) {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized",
        };
      }
      
      const token = authHeader.split(" ")[1];
      if (!token) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized",
        };
      }
    }
  }, (app) => app
    .derive(({ headers }) => {
      const authHeader = headers["authorization"];
      const token = authHeader?.startsWith("Bearer ") ? (authHeader.split(" ")[1] ?? "") : "";
      return { token };
    })
    .get("/users/current", async ({ token, set }) => {
      const result = await getCurrentUser(token);
      if (!result.success) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized",
        };
      }
      
      set.status = 200;
      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    }, {
      headers: t.Object({
        authorization: t.String({ error: "Authorization header is required", default: "Bearer <token>", description: "Format: Bearer <token>" })
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            created_at: t.Nullable(t.Any()),
            updated_at: t.Nullable(t.Any())
          })
        }),
        401: t.Object({
          success: t.Boolean(),
          message: t.String()
        })
      },
      detail: {
        tags: ["Users"],
        summary: "Ambil Profil Pengguna Saat Ini",
        description: "Mengambil detail profil pengguna yang sedang login berdasarkan token autentikasi di header."
      }
    })
    .post("/users/logout", async ({ token, set }) => {
      const result = await logoutUser(token);
      if (!result.success) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized",
        };
      }
      
      set.status = 200;
      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    }, {
      headers: t.Object({
        authorization: t.String({ error: "Authorization header is required", default: "Bearer <token>", description: "Format: Bearer <token>" })
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.String()
        }),
        401: t.Object({
          success: t.Boolean(),
          message: t.String()
        })
      },
      detail: {
        tags: ["Users"],
        summary: "Logout Pengguna",
        description: "Mengakhiri sesi aktif dengan menghapus token dari database."
      }
    })
  );



