import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

describe("Users API", () => {
  // Setiap skenario test dijalankan dengan state database yang bersih
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users - Registration", () => {
    it("should successfully register a new user with valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "johndoe@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json() as any;
      expect(body.success).toBe(true);
      expect(body.message).toBe("User created successfully");
      expect(body.data.name).toBe("John Doe");
      expect(body.data.email).toBe("johndoe@example.com");
      expect(body.data.id).toBeDefined();
    });

    it("should fail to register if email is already registered", async () => {
      // Daftarkan user pertama
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      // Coba daftarkan user kedua dengan email yang sama
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "duplicate@example.com",
            password: "password456",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toBe("User already exists");
    });

    it("should fail to register with invalid email format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "notanemail",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422); // Elysia validation error status
    });

    it("should fail to register if password is too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "valid@example.com",
            password: "12345", // kurang dari 6
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail to register if name is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "valid@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail to register if name is more than 255 characters", async () => {
      const longName = "a".repeat(256);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "valid@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/users/login - Login", () => {
    beforeEach(async () => {
      // Daftarkan satu user untuk bahan testing login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Registered User",
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("should successfully login with valid credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.success).toBe(true);
      expect(body.message).toBe("User login successfully");
      expect(body.data.token).toBeDefined();
    });

    it("should fail to login with non-existent email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toBe("Email atau Password salah");
    });

    it("should fail to login with incorrect password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toBe("Email atau Password salah");
    });

    it("should fail to login with invalid format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notanemail",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("GET /api/users/current - Get Current User", () => {
    let token: string;

    beforeEach(async () => {
      // Registrasi dan login untuk mendapatkan token
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Alice",
            email: "alice@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "alice@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = await loginRes.json() as any;
      token = loginBody.data.token;
    });

    it("should successfully fetch profile with a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe("Alice");
      expect(body.data.email).toBe("alice@example.com");
    });

    it("should fail to fetch profile without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toBe("Unauthorized");
    });

    it("should fail to fetch profile with malformed Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `NotBearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(401);
    });

    it("should fail to fetch profile with invalid/expired token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": "Bearer non-existent-token-12345",
          },
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/users/logout - Logout", () => {
    let token: string;

    beforeEach(async () => {
      // Registrasi dan login
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bob",
            email: "bob@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bob@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = await loginRes.json() as any;
      token = loginBody.data.token;
    });

    it("should successfully logout and invalidate token", async () => {
      // Panggil endpoint logout
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.success).toBe(true);
      expect(body.message).toBe("User logout successfully");

      // Coba akses get profile dengan token yang sama, harus ditolak (401)
      const currentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
      );
      expect(currentRes.status).toBe(401);
    });

    it("should fail to logout without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "POST",
        })
      );

      expect(response.status).toBe(401);
    });

    it("should fail to logout with an invalid/already deleted token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "POST",
          headers: {
            "Authorization": "Bearer non-existent-token",
          },
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
