import { defineConfig, devices } from "@playwright/test"

// End-to-end smoke tests against the production build: run `npm run build` first, then
// `npm run test:e2e`. They don't need a real Supabase project — without a session every
// protected route redirects to /login, and that public surface (CSP, hydration, fonts,
// error reporting) is what they cover. Flows behind the login need a test Supabase project
// (see docs/TESTING.md).
const PORT = 3100

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
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-placeholder-anon-key",
    },
  },
})
