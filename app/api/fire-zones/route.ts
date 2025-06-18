import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request) {
  try {
    const data = await request.json()
    const supabase = createServerSupabaseClient()

    // Handle insert
    const { error } = await supabase.from("fire_zones").insert(data)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in fire-zones API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, ...data } = await request.json()
    const supabase = createServerSupabaseClient()

    // Handle update using server-side client with service role
    const { error } = await supabase.from("fire_zones").update(data).eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in fire-zones API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
