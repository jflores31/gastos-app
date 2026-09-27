import { randomUUID } from "node:crypto"
import { expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test"

// Where the mock Supabase listens (e2e/mock-supabase). The app must be built with
// NEXT_PUBLIC_SUPABASE_URL pointing here for the tests behind the login.
export const MOCK_SUPABASE_URL = process.env.MOCK_SUPABASE_URL ?? "http://127.0.0.1:54321"

// Collects everything that would show up red in the browser console.
export function watchConsole(page: Page) {
  const problems: string[] = []
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()) })
  page.on("pageerror", (e) => problems.push(String(e)))
  return problems
}

// One mock user per test: each starts with the seed dataset and can't see the others' rows.
// Random suffix: locally the mock server outlives a run (reuseExistingServer).
export const uniqueEmail = (info: TestInfo) => `${info.testId}-${randomUUID().slice(0, 8)}@e2e.test`

export async function login(page: Page, email: string, password = "secret123") {
  await page.goto("/login")
  await page.getByLabel(/correo|email/i).first().fill(email)
  await page.getByLabel(/contraseña|password/i).first().fill(password)
  await page.getByRole("button", { name: "Ingresar", exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  // Data loaded: the income card shows the seeded salary.
  await expect(page.getByText("S/3,500").first()).toBeVisible()
}

type Row = Record<string, unknown>
export async function mockDb(request: APIRequestContext, email: string) {
  const res = await request.get(`${MOCK_SUPABASE_URL}/__mock/db?email=${encodeURIComponent(email)}`)
  expect(res.ok()).toBe(true)
  return (await res.json()) as { user: { id: string; user_metadata: Row; factors: Row[] }; tables: Record<string, Row[]> }
}
