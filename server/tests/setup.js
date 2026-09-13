import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * We test against a real, isolated in-memory MongoDB instance rather than
 * mocking Mongoose. This is a deliberate trade-off: it means our
 * authorization tests (unique indexes, cast errors, etc.) exercise the
 * actual database behavior, at the cost of a slightly slower test boot.
 * No external MongoDB installation or connection is required to run
 * `npm test`.
 */
let mongoServer;

export async function startTestDB() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function stopTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
