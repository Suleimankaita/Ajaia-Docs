import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { startTestDB, stopTestDB, clearTestDB } from "./setup.js";

const app = createApp();

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("auth", () => {
  it("registers a user and never returns the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("jane@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects duplicate email registration with 409", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "dup@example.com",
      password: "Password123!",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe 2",
      email: "dup@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(409);
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "wrongpass@example.com",
      password: "Password123!",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "wrongpass@example.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to protected routes", async () => {
    const res = await request(app).get("/api/documents");
    expect(res.status).toBe(401);
  });
});
