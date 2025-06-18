import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get distinct teams
    const { data, error } = await supabase.from("users").select("team").not("team", "is", null).order("team")

    if (error) {
      throw error
    }

    // Extract unique teams
    const uniqueTeams = [...new Set(data.map((item) => item.team))]

    return NextResponse.json({ teams: uniqueTeams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
