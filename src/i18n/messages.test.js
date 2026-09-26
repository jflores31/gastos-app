import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { MESSAGES, messagesFor } from "./index.js"

// Every key path with the kind of value it holds, e.g. "goalsTab.newGoal: string",
// "overviewTab.greeting: function/2", "months: array/12".
function shape(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix + k
    if (typeof v === "function") return [`${key}: function/${v.length}`]
    if (Array.isArray(v)) return [`${key}: array/${v.length}`]
    if (v && typeof v === "object") return shape(v, key + ".")
    return [`${key}: ${typeof v}`]
  })
}

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [p] : []
  })
}

describe("i18n", () => {
  it("es y en tienen las mismas claves, con el mismo tipo (y la misma aridad en las funciones)", () => {
    expect(shape(MESSAGES.en)).toEqual(shape(MESSAGES.es))
  })

  it("ningún texto queda vacío y las funciones devuelven texto", () => {
    for (const lang of ["es", "en"]) {
      const walk = (obj, prefix) => {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === "string") expect(v.trim(), `${lang}.${prefix}${k}`).not.toBe("")
          else if (typeof v === "function") expect(typeof v(...Array(v.length).fill(1)), `${lang}.${prefix}${k}`).toBe("string")
          else if (v && typeof v === "object" && !Array.isArray(v)) walk(v, `${prefix}${k}.`)
        }
      }
      walk(MESSAGES[lang], "")
    }
  })

  it("los componentes no eligen textos con `lang === \"es\" ? … : …` (van en src/i18n)", () => {
    const src = fileURLToPath(new URL("..", import.meta.url))
    const offenders = sourceFiles(src)
      .filter((f) => !f.includes(`${path.sep}i18n${path.sep}`))
      .flatMap((f) => readFileSync(f, "utf8").split("\n")
        .map((line, i) => (/lang\s*===?\s*["']es["']/.test(line) ? `${path.relative(src, f)}:${i + 1}` : null))
        .filter(Boolean))
    expect(offenders).toEqual([])
  })

  it("messagesFor cae en español con un idioma desconocido", () => {
    expect(messagesFor("fr")).toBe(MESSAGES.es)
    expect(messagesFor("en").common.delete).toBe("Delete")
  })

  it("plurales y textos con datos", () => {
    const { es, en } = MESSAGES
    expect(es.overviewTab.expenseRecords(1)).toBe("1 gasto")
    expect(es.overviewTab.expenseRecords(3)).toBe("3 gastos")
    expect(en.overviewTab.incomeRecords(1)).toBe("1 record")
    expect(es.common.vsPreviousPeriod("quarter")).toBe("vs trimestre anterior")
    expect(en.common.vsPreviousPeriod("all")).toBe("vs previous year")
    expect(es.overviewTab.greeting(9, " Ana")).toBe("Buenos días Ana,")
    expect(en.overviewTab.greeting(20, "")).toBe("Good evening,")
  })
})
