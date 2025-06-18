import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request, { params }) {
  try {
    const id = params.id

    // Special case: if the ID is "add", return a 404 to allow the static route to handle it
    if (id === "add") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!id) {
      return NextResponse.json({ error: "Missing fire zone ID" }, { status: 400 })
    }

    // Validate that the ID is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid fire zone ID format" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("fire_zones").select("*").eq("id", id).single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Fire zone not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
