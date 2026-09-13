/**
 * Optional development/demo helper.
 *
 * Creates two demo users so a reviewer can log in immediately without
 * registering accounts by hand:
 *
 *   demo-owner@example.com   / Password123!
 *   demo-editor@example.com  / Password123!
 *
 * This is clearly a development convenience, never run in production,
 * and does not contain any real secrets.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { DocumentShare } from "../models/DocumentShare.js";

const DEMO_PASSWORD = "Password123!";

async function upsertDemoUser(name, email) {
  let user = await User.findOne({ email });
  if (user) {
    return user;
  }
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  user = await User.create({ name, email, password: passwordHash });
  return user;
}

async function seed() {
  await connectDB();

  const owner = await upsertDemoUser("Demo Owner", "demo-owner@example.com");
  const editor = await upsertDemoUser("Demo Editor", "demo-editor@example.com");

  let doc = await Document.findOne({ owner: owner._id, title: "Welcome to Ajaia Docs" });
  if (!doc) {
    doc = await Document.create({
      title: "Welcome to Ajaia Docs",
      owner: owner._id,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to Ajaia Docs" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This document was created by the seed script. Try editing it, then log in as the editor account to see shared access in action.",
              },
            ],
          },
        ],
      },
    });
  }

  await DocumentShare.findOneAndUpdate(
    { document: doc._id, user: editor._id },
    { permission: "editor" },
    { upsert: true }
  );

  console.log("Seed complete:");
  console.log(`  Owner  -> demo-owner@example.com  / ${DEMO_PASSWORD}`);
  console.log(`  Editor -> demo-editor@example.com / ${DEMO_PASSWORD}`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
