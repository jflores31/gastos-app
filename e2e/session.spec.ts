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

test("Metas: cuentas, inversiones, deudas y suscripciones se crean, editan y borran", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)
  await page.getByRole("tab", { name: "Metas" }).click()
  const save = () => dialog(page).getByRole("button", { name: "Guardar" }).click()
  const db = async () => (await mockDb(request, email)).tables

  // Account: create, edit from the list, delete from the list.
  await page.getByRole("button", { name: "Nueva cuenta" }).click()
  await dialog(page).getByLabel("Nombre").fill("Interbank")
  await dialog(page).getByRole("combobox", { name: /Tipo/ }).click()
  await page.getByRole("option", { name: "Tarjeta" }).click()
  await dialog(page).getByLabel("Saldo").fill("-300")
  await dialog(page).getByLabel("Límite").fill("1000")
  await save()
  await expect(page.getByText("Interbank")).toBeVisible()
  expect((await db()).accounts.find((a) => a.name === "Interbank")).toMatchObject({ type: "card", balance: -300, account_limit: 1000 })
  // Innermost element holding both the name and its buttons: the account's row.
  const accountRow = page.locator("div").filter({ hasText: "Interbank" }).filter({ has: page.getByRole("button", { name: "Editar" }) }).last()
  await accountRow.getByRole("button", { name: "Editar" }).click()
  await dialog(page).getByLabel("Saldo").fill("-450")
  await save()
  await expect.poll(async () => (await db()).accounts.find((a) => a.name === "Interbank")?.balance).toBe(-450)
  await accountRow.getByRole("button", { name: "Eliminar" }).click()
  await expect(page.getByText("Interbank")).toHaveCount(0)
  await expect.poll(async () => (await db()).accounts.map((a) => a.name)).toEqual(["BCP"])

  // Investment: create, then open it and delete from the dialog.
  await page.getByRole("button", { name: "Agregar", exact: true }).click()
  await dialog(page).getByLabel("Nombre").fill("Fondo mutuo")
  await dialog(page).getByLabel("Valor").fill("1200")
  await dialog(page).getByLabel("Rendimiento %").fill("8")
  await dialog(page).getByRole("combobox", { name: /Tipo/ }).click()
  await page.getByRole("option", { name: "Acciones" }).click()
  await save()
  await expect(page.getByText("Fondo mutuo")).toBeVisible()
  expect((await db()).investments.find((i) => i.label_es === "Fondo mutuo")).toMatchObject({ value: 1200, return_rate: 8, type: "stocks" })
  await page.getByText("Fondo mutuo").click()
  await dialog(page).getByRole("button", { name: "Eliminar" }).click()
  await expect(page.getByText("Fondo mutuo")).toHaveCount(0)

  // Debt: create and edit.
  await page.getByRole("button", { name: "Agregar deuda" }).click()
  await dialog(page).getByLabel("Nombre").fill("Tarjeta Visa")
  await dialog(page).getByLabel("Saldo pendiente").fill("2400")
  await dialog(page).getByLabel("Tasa % TEA").fill("40")
  await dialog(page).getByLabel("Cuota/mes").fill("200")
  await dialog(page).getByLabel("Cuotas restantes").fill("12")
  await dialog(page).getByLabel("Total cuotas").fill("12")
  await save()
  await page.getByRole("button", { name: /Tarjeta Visa/ }).click()
  await dialog(page).getByLabel("Cuotas restantes").fill("11")
  await save()
  await expect.poll(async () => (await db()).debts.find((d) => d.label_es === "Tarjeta Visa")).toMatchObject({ balance: 2400, rate: 40, monthly: 200, remaining: 11, original_months: 12 })

  // Subscription: create with a category, then delete.
  await page.getByRole("button", { name: "Agregar suscripción" }).click()
  await dialog(page).getByLabel("Nombre").fill("Spotify")
  await dialog(page).getByLabel("Precio").fill("240")
  await dialog(page).getByRole("combobox", { name: /Ciclo/ }).click()
  await page.getByRole("option", { name: "Anual" }).click()
  await dialog(page).getByRole("combobox", { name: /Categoría/ }).click()
  await page.getByRole("option", { name: "Gatos" }).click() // custom category
  await save()
  const cat = (await db()).custom_categories.find((c) => c.nombre === "Gatos")!
  await expect.poll(async () => (await db()).subscriptions.find((s) => s.name === "Spotify")).toMatchObject({ price: 240, cycle: "yearly", category: `custom_${cat.id}` })
  await page.getByRole("button", { name: /Spotify/ }).click()
  await dialog(page).getByRole("button", { name: "Eliminar" }).click()
  // Wait for the dialog to close: while it's open the page behind is aria-hidden, so a
  // role query would find nothing even before the delete finishes.
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Spotify/ })).toHaveCount(0)
  await expect.poll(async () => (await db()).subscriptions.map((s) => s.name)).toEqual(["Netflix"])
})

test("Presupuestos: editar en la tarjeta, agregar (también de una categoría propia) y borrar", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)
  const budgets = async () => Object.fromEntries((await mockDb(request, email)).tables.budgets.map((b) => [b.categoria, b.monto]))
  await page.getByRole("tab", { name: "Presupuesto" }).click()
  await expect(page.getByText("S/800").first()).toBeVisible() // 600 + 200

  // Inline edit from the card's limit chip.
  await page.getByRole("button", { name: "S/600" }).click()
  const inline = page.locator("input[type=number]").first()
  await inline.fill("700")
  await inline.press("Enter")
  await expect.poll(budgets).toEqual({ COMIDA: 700, TRANSPORTE: 200 })

  // "Gestionar": add a native and a custom category, then delete one.
  await page.getByRole("button", { name: "Gestionar" }).click()
  const manage = page.getByRole("dialog").filter({ hasText: "Gestionar Presupuestos" })
  const add = async (cat: string, amount: string) => {
    await manage.getByRole("combobox", { name: /Categoría/ }).click()
    await page.getByRole("option", { name: cat, exact: true }).click()
    await manage.getByLabel("Monto mensual").fill(amount)
    await manage.getByRole("button", { name: "Agregar" }).click()
    await expect(manage.getByText(cat, { exact: true })).toBeVisible()
  }
  await add("Streaming", "50")
  await add("Gatos", "80")
  const catId = (await mockDb(request, email)).tables.custom_categories[0].id
  await expect.poll(budgets).toEqual({ COMIDA: 700, TRANSPORTE: 200, STREAMING: 50, [`custom_${catId}`]: 80 })

  // Edit an existing one from the list; cancelling keeps the old amount. (While editing,
  // the row shows only the amount field and its Save / Cancel buttons.)
  const streaming = manage.getByRole("listitem").filter({ hasText: "Streaming" })
  await streaming.getByRole("button", { name: "Editar presupuesto" }).click()
  await manage.locator("input[type=number]").first().fill("999")
  await manage.getByRole("button", { name: "Cancelar" }).click()
  await expect(streaming).toContainText("S/50")
  await streaming.getByRole("button", { name: "Editar presupuesto" }).click()
  await manage.locator("input[type=number]").first().fill("60")
  await manage.getByRole("button", { name: "Guardar" }).click()
  await expect.poll(budgets).toEqual({ COMIDA: 700, TRANSPORTE: 200, STREAMING: 60, [`custom_${catId}`]: 80 })

  await manage.getByRole("listitem").filter({ hasText: "Transporte" }).getByRole("button", { name: "Eliminar presupuesto" }).click()
  await page.getByRole("dialog").filter({ hasText: "Eliminar presupuesto" }).getByRole("button", { name: "Eliminar" }).click()
  await expect.poll(budgets).toEqual({ COMIDA: 700, STREAMING: 60, [`custom_${catId}`]: 80 })
})

test("Perfil: nombre, favoritas y categorías personalizadas (editar y borrar)", async ({ page, request }, info) => {
  const email = uniqueEmail(info)
  await login(page, email)
  const meta = async () => (await mockDb(request, email)).user.user_metadata
  await openSettings(page, "Perfil")
  const panel = dialog(page).first()

  // Name → auth user_metadata.
  await panel.getByLabel("Nombre", { exact: true }).fill("Ana")
  await panel.getByLabel("Apellidos").fill("Quispe Flores")
  await panel.getByRole("button", { name: "Guardar" }).click()
  await expect(toast(page, "Nombre actualizado")).toBeVisible()
  expect(await meta()).toMatchObject({ first_name: "Ana", last_name: "Quispe Flores", full_name: "Ana Quispe Flores" })
  await expect(panel.getByText("Ana Quispe Flores")).toBeVisible()

  // Favourites: add two, remove one.
  for (const cat of ["Comida", "Sueldo"]) {
    await panel.getByLabel("Agregar favorita").fill(cat)
    await page.getByRole("option", { name: cat, exact: true }).click()
    await expect(panel.getByRole("button", { name: cat })).toBeVisible()
  }
  expect((await meta()).fav_categories).toEqual([{ categoria: "COMIDA", tipo: "EGRESO" }, { categoria: "SUELDO", tipo: "INGRESO" }])
  await panel.getByRole("button", { name: "Comida" }).locator(".MuiChip-deleteIcon").click()
  await expect.poll(async () => (await meta()).fav_categories).toEqual([{ categoria: "SUELDO", tipo: "INGRESO" }])

  // Custom category: rename + recolour the seeded one, then delete it (with confirmation).
  await panel.getByRole("button", { name: "Editar categoría" }).click()
  const catDialog = page.getByRole("dialog").filter({ hasText: "Editar Categoría" })
  await catDialog.getByLabel("Nombre").fill("Michis")
  await catDialog.getByRole("radio", { name: "#3498db" }).click()
  await catDialog.getByRole("button", { name: "Ingreso" }).click()
  await catDialog.getByRole("button", { name: "Guardar" }).click()
  await expect(toast(page, "Categoría actualizada")).toBeVisible()
  expect((await mockDb(request, email)).tables.custom_categories).toEqual([expect.objectContaining({ nombre: "Michis", color: "#3498db", tipo: "INGRESO", icon: "Pets" })])

  await panel.getByRole("button", { name: "Eliminar categoría" }).click()
  const confirm = page.getByRole("dialog").filter({ hasText: "¿Eliminar \"Michis\"?" })
  await confirm.getByRole("button", { name: "Eliminar" }).click()
  await expect(toast(page, "Categoría eliminada")).toBeVisible()
  expect((await mockDb(request, email)).tables.custom_categories).toEqual([])
  await expect(panel.getByText("Ninguna aún. Crea tu primera categoría.")).toBeVisible()
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
