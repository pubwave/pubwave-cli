import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    // The wizard component test renders Ink and inspects state across many
    // setState/useEffect cycles. When other test files run alongside it,
    // intermittent CPU pressure leaves the renderer mid-update and the test
    // observes a half-baked frame. Pinning to a single fork keeps everything
    // sequential and removes that timing race.
    pool: "forks",
    fileParallelism: false,
  },
});
