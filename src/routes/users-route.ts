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
      name: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    })
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
    })
  })
  .get("/users/current", async ({ headers, set }) => {
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
  })
  .post("/users/logout", async ({ headers, set }) => {
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
  });


