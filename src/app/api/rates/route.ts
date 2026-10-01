import { NextResponse } from "next/server"
import { fetchRates } from "@/lib/rates"

// Today's exchange rates (see src/lib/rates.ts). Behind the login like the rest of /api.
export async function GET() {
  return NextResponse.json(await fetchRates(), { headers: { "Cache-Control": "private, max-age=3600" } })
}
