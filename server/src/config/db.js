import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI supplied via environment variables.
 * Kept as a single, isolated function so tests can connect to a different
 * (in-memory) database without touching the rest of the app.
 */
export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set. Check your .env file.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
