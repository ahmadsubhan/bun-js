import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-service";

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
  });
