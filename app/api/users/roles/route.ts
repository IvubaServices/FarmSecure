import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get distinct roles
    const { data, error } = await supabase.from("users").select("role").order("role")

    if (error) {
      throw error
    }

    // Extract unique roles
    const uniqueRoles = [...new Set(data.map((item) => item.role))]

    return NextResponse.json({ roles: uniqueRoles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
