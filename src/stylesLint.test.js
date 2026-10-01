import { describe, it, expect } from "vitest"
import { ESLint } from "eslint"

// The T16 rule of eslint.config.js: no colour literals or style={{}} in components, whose styles
// go in src/theme/ and *.styles.ts. Each case lints a snippet as if it were the given file.
const eslint = new ESLint({ cwd: new URL("..", import.meta.url).pathname })
const errors = async (code, filePath = "src/features/demo/Demo.jsx") => {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((m) => m.ruleId === "no-restricted-syntax").map((m) => m.message)
}

describe("regla de estilos (T16)", { timeout: 30_000 }, () => {
  it("un color literal en un componente es un error: #hex, rgba() y dentro de un template", async () => {
    expect(await errors('export const A = () => <div sx={{ color: "#fff" }} />')).toEqual([expect.stringMatching(/^Color literal/)])
    expect(await errors('export const A = () => <div sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />', "src/features/demo/Demo.tsx")).toHaveLength(1)
    expect(await errors("export const A = ({ c }) => <div sx={{ background: `linear-gradient(90deg, #a1b2c3 0%, ${c} 100%)` }} />")).toHaveLength(1)
  })

  it("style={{}} en un componente es un error", async () => {
    expect(await errors("export const A = () => <div style={{ margin: 0 }} />")).toEqual([expect.stringMatching(/^style=\{\{\}\}/)])
  })

  it("se permiten en src/theme/, en los *.styles.ts y en los tests", async () => {
    expect(await errors('export const A = () => <div sx={{ color: "#fff" }} />', "src/theme/Demo.tsx")).toEqual([])
    expect(await errors('export const a = { color: "#123456" }', "src/features/demo/Demo.styles.ts")).toEqual([])
    expect(await errors('export const a = { color: "#123456" }', "src/features/demo/Demo.test.jsx")).toEqual([])
  })

  it("url(#id) y href=\"#id\" apuntan a un elemento, no son colores", async () => {
    expect(await errors('export const A = ({ id }) => <><path fill={`url(#${id})`} /><path fill="url(#abc)" /><a href="#add">x</a></>')).toEqual([])
  })
})
