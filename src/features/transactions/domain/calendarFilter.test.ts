import { describe, expect, it } from "vitest"
import { matchesCalendar } from "./calendarFilter"

const at = (y: number, m: number, d: number, h = 12) => ({ date: new Date(y, m, d, h) })

describe("matchesCalendar", () => {
  it("un día: mismo día a cualquier hora, no el día anterior ni el mismo día de otro mes o año", () => {
    const day = { type: "day" as const, date: new Date(2026, 2, 15) }
    expect(matchesCalendar(at(2026, 2, 15, 0), day)).toBe(true)
    expect(matchesCalendar(at(2026, 2, 15, 23), day)).toBe(true)
    expect(matchesCalendar(at(2026, 2, 14, 23), day)).toBe(false)
    expect(matchesCalendar(at(2026, 3, 15), day)).toBe(false)
    expect(matchesCalendar(at(2025, 2, 15), day)).toBe(false)
  })

  it("un mes: del 1 al último día, no el mismo mes de otro año", () => {
    const month = { type: "month" as const, date: new Date(2026, 1, 1) }
    expect(matchesCalendar(at(2026, 1, 1, 0), month)).toBe(true)
    expect(matchesCalendar(at(2026, 1, 28, 23), month)).toBe(true)
    expect(matchesCalendar(at(2026, 2, 1, 0), month)).toBe(false)
    expect(matchesCalendar(at(2025, 1, 10), month)).toBe(false)
  })
})
