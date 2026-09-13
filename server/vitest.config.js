import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    hookTimeout: 30000, // starting the in-memory MongoDB instance can take a moment
    testTimeout: 15000,
    fileParallelism: false, // tests share one in-memory DB, so run files sequentially
  },
});
