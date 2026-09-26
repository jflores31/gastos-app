import { test, expect, type Page } from "@playwright/test"
import { login, mockDb, uniqueEmail, watchConsole } from "./helpers"

// Flows behind the login, against the mock Supabase in e2e/mock-supabase.

const dialog = (page: Page) => page.getByRole("dialog")
const toast = (page: Page, text: string | RegExp) => page.getByRole("alert").filter({ hasText: text })

async function openSettings(page: Page, tab: "Perfil" | "Ajustes") {
  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByRole("tab", { name: tab }).click()
}

async function pickCategory(page: Page, name: string) {
  await dialog(page).getByLabel("Categoría").click()
  await page.getByRole("option", { name, exact: true }).click()
}

test("credenciales inválidas: muestra el error y no entra", async ({ page }, info) => {
  await page.goto("/login")
  await page.getByLabel(/correo|email/i).first().fill(uniqueEmail(info))
  await page.getByLabel(/contraseña|password/i).first().fill("wrong-password")
  await page.getByRole("button", { name: "Ingresar", exact: true }).click()
  await expect(page.getByText("Credenciales inválidas")).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test("con sesión: todas las pestañas, los ajustes y el inglés cargan sin errores de consola", async ({ page }, info) => {
  const problems = watchConsole(page)
  await login(page, uniqueEmail(info))

  const tabs: [string, string][] = [
    ["Gastos", "SUPERMERCADO"],
    ["Ingresos", "SUELDO POR PLANILLA"],
    ["Presupuesto", "Gestionar"],
    ["Metas", "Fondo de emergencia"],
    ["Resumen", "Anomalías"],
  ]
  for (const [tab, content] of tabs) {
    await page.getByRole("tab", { name: tab }).click()
    await expect(page.getByText(content).first()).toBeVisible()
  }

  await openSettings(page, "Perfil")
  await expect(dialog(page).getByText("Gatos")).toBeVisible() // seeded custom category
  await page.getByRole("tab", { name: "Ajustes" }).click()
  await page.getByText("Oscuro", { exact: true }).click()
  await page.getByText("🇺🇸 English").click()
  await page.getByRole("button", { name: "Close" }).click()
  for (const tab of ["Expenses", "Income", "Budget", "Goals", "Overview"]) {
    await page.getByRole("tab", { name: tab }).click()
  }
  await expect(page.getByText("Unusual", { exact: false }).first()).toBeVisible()
  expect(problems).toEqual([])
})

test("alta, edición y borrado de un gasto llegan a la base", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)
  const { user } = await mockDb(request, email)
  const pan = async () => (await mockDb(request, email)).tables.transactions.filter((t) => t.concepto === "PAN")

  await page.getByRole("button", { name: "Nueva transacción" }).click()
  await dialog(page).getByRole("button", { name: "Egresos" }).click()
  await pickCategory(page, "Comida")
  await dialog(page).getByLabel("Concepto").fill("PAN")
  await dialog(page).getByLabel("Monto").fill("12.5")
  await dialog(page).getByRole("button", { name: "Guardar" }).click()
  await expect(toast(page, "Transacción guardada")).toBeVisible()
  expect(await pan()).toEqual([expect.objectContaining({ user_id: user.id, tipo: "EGRESO", categoria: "COMIDA", valor: 12.5 })])

  await page.getByRole("tab", { name: "Gastos" }).click()
  const row = page.getByRole("listitem").filter({ hasText: "PAN" })
  await row.getByRole("button", { name: "Editar" }).click()
  await expect(dialog(page).getByLabel("Monto")).toHaveValue("12.5")
  await dialog(page).getByLabel("Monto").fill("20")
  await dialog(page).getByRole("button", { name: "Actualizar" }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(await pan()).toEqual([expect.objectContaining({ valor: 20 })])

  await row.getByRole("button", { name: "Eliminar" }).click()
  await dialog(page).getByRole("button", { name: "Eliminar" }).click()
  await expect(toast(page, "Transacción eliminada")).toBeVisible()
  await expect(row).toHaveCount(0)
  expect(await pan()).toEqual([])
})

test("en USD los montos se muestran convertidos y se guardan en PEN", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)
  await openSettings(page, "Ajustes")
  await dialog(page).getByRole("combobox", { name: /Moneda/ }).click()
  await page.getByRole("option", { name: /USD/ }).click()
  await page.getByRole("button", { name: "Close" }).click()
  await expect(page.getByText("$945").first()).toBeVisible() // S/3,500 × 0.27

  await page.getByRole("button", { name: "Nueva transacción" }).click()
  await dialog(page).getByRole("button", { name: "Egresos" }).click()
  await pickCategory(page, "Comida")
  await dialog(page).getByLabel("Concepto").fill("CENA")
  await dialog(page).getByLabel("Monto").fill("27")
  await dialog(page).getByRole("button", { name: "Guardar" }).click()
  await expect(toast(page, "Transacción guardada")).toBeVisible()
  const { tables } = await mockDb(request, email)
  expect(tables.transactions.find((t) => t.concepto === "CENA")).toMatchObject({ valor: 100 })
})

test("una meta nueva y una categoría personalizada se guardan con su icono", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)

  await page.getByRole("tab", { name: "Metas" }).click()
  await page.getByRole("button", { name: "Nueva meta" }).click()
  await dialog(page).getByLabel("Nombre").fill("Viaje a Cusco")
  await dialog(page).getByLabel("Monto objetivo").fill("2000")
  await dialog(page).getByRole("radio", { name: "Flight" }).click()
  await dialog(page).getByRole("button", { name: "Guardar" }).click()
  await expect(page.getByText("Viaje a Cusco")).toBeVisible()

  await openSettings(page, "Perfil")
  await dialog(page).getByRole("button", { name: "Nueva", exact: true }).click()
  const catDialog = page.getByRole("dialog").filter({ hasText: "Nueva Categoría" })
  await catDialog.getByLabel("Nombre").fill("Plantas")
  await catDialog.getByRole("radio", { name: "Spa" }).click()
  await catDialog.getByRole("button", { name: "Guardar" }).click()
  await expect(page.getByText("Plantas")).toBeVisible()

  const { tables } = await mockDb(request, email)
  expect(tables.goals.find((g) => g.label_es === "Viaje a Cusco")).toMatchObject({ target: 2000, icon: "Flight" })
  expect(tables.custom_categories.find((c) => c.nombre === "Plantas")).toMatchObject({ tipo: "EGRESO", icon: "Spa" })
})

test("una pestaña nueva no cierra la sesión; Salir sí", async ({ page, context }, info) => {
  await login(page, uniqueEmail(info))

  // Regression: opening the app in a second tab used to sign out every tab.
  const second = await context.newPage()
  await second.goto("/")
  await expect(second.getByText("S/3,500").first()).toBeVisible()
  await second.waitForTimeout(1000) // past the 300 ms BroadcastChannel handshake
  await expect(second).toHaveURL(/\/$/)
  await page.reload()
  await expect(page).toHaveURL(/\/$/)

  await second.getByRole("button", { name: "Cerrar sesión" }).click()
  await expect(second).toHaveURL(/\/login$/)
  await second.goto("/")
  await expect(second).toHaveURL(/\/login$/)
})

test("al reabrir el navegador (sin otra pestaña abierta) pide iniciar sesión de nuevo", async ({ page, browser }, info) => {
  await login(page, uniqueEmail(info))
  // Same cookies, but a fresh browser session: no sessionStorage flag and no tab to answer.
  const reopened = await browser.newContext({ storageState: await page.context().storageState() })
  const tab = await reopened.newPage()
  await tab.goto("/")
  await expect(tab).toHaveURL(/\/login$/)
  await reopened.close()
})
