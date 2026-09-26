import { defineConfig, devices } from "@playwright/test"

// End-to-end tests against the production build. They don't need a real Supabase project:
// e2e/mock-supabase is a small stand-in for Auth + PostgREST that runs next to the app.
// The build must point at it, because Next inlines NEXT_PUBLIC_* at build time:
//
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e npm run build
//   npm run test:e2e
const PORT = 3100
const MOCK_PORT = 54321

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-supabase/server.mjs",
      url: `http://127.0.0.1:${MOCK_PORT}/__mock/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_SUPABASE_PORT: String(MOCK_PORT) },
    },
    {
      command: `npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? `http://127.0.0.1:${MOCK_PORT}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-anon-key",
      },
    },
  ],
})
