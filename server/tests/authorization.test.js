import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { startTestDB, stopTestDB, clearTestDB } from "./setup.js";

const app = createApp();

async function registerUser(name, email) {
  const res = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "Password123!",
  });
  return { token: res.body.token, user: res.body.user };
}

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("document sharing authorization", () => {
  it("blocks an unshared user from editing, then allows it once shared as editor", async () => {
    const userA = await registerUser("User A", "usera@example.com");
    const userB = await registerUser("User B", "userb@example.com");

    // 1. User A creates a document.
    const createRes = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ title: "A's Document" });

    expect(createRes.status).toBe(201);
    const documentId = createRes.body.document._id;

    // 2. User B attempts to edit the document -> must be rejected.
    const forbiddenRes = await request(app)
      .patch(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ title: "Hacked title" });

    expect(forbiddenRes.status).toBe(403);

    // 3. User A shares the document with User B as an editor.
    const shareRes = await request(app)
      .post(`/api/documents/${documentId}/shares`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ email: "userb@example.com", permission: "editor" });

    expect(shareRes.status).toBe(201);
    expect(shareRes.body.share.permission).toBe("editor");

    // 4. User B edits the document -> must now succeed.
    const editRes = await request(app)
      .patch(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ title: "Edited by B" });

    expect(editRes.status).toBe(200);

    // 5. Verify the document was actually changed, not just that the
    // request returned 200.
    const fetchRes = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.document.title).toBe("Edited by B");
  });

  it("allows a viewer to read but rejects any edit attempt", async () => {
    const owner = await registerUser("Owner", "owner2@example.com");
    const viewer = await registerUser("Viewer", "viewer2@example.com");

    const createRes = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Viewer Test Doc" });
    const documentId = createRes.body.document._id;

    await request(app)
      .post(`/api/documents/${documentId}/shares`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: "viewer2@example.com", permission: "viewer" });

    // Viewer can read.
    const readRes = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${viewer.token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.document.role).toBe("viewer");

    // Viewer cannot edit.
    const editAttempt = await request(app)
      .patch(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ title: "Should not be allowed" });
    expect(editAttempt.status).toBe(403);

    // Viewer cannot delete.
    const deleteAttempt = await request(app)
      .delete(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${viewer.token}`);
    expect(deleteAttempt.status).toBe(403);

    // Viewer cannot share.
    const shareAttempt = await request(app)
      .post(`/api/documents/${documentId}/shares`)
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ email: "owner2@example.com", permission: "editor" });
    expect(shareAttempt.status).toBe(403);
  });

  it("returns 404 (not 403) for a user with no relationship to the document", async () => {
    const owner = await registerUser("Owner3", "owner3@example.com");
    const stranger = await registerUser("Stranger", "stranger@example.com");

    const createRes = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Private Doc" });
    const documentId = createRes.body.document._id;

    const res = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
  });
});
