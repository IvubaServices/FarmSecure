import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request) {
  try {
    const data = await request.json()
    console.log("API received data:", data)

    if (!data.id) {
      return NextResponse.json({ success: false, error: "Missing fire zone ID" }, { status: 400 })
    }

    // Extract the ID and prepare the update data
    const { id, ...updateData } = data

    // Ensure numeric values
    if (updateData.latitude) updateData.latitude = Number(updateData.latitude)
    if (updateData.longitude) updateData.longitude = Number(updateData.longitude)

    // Add timestamp
    updateData.updated_at = new Date().toISOString()

    console.log("Updating fire zone ID:", id)
    console.log("Update data:", updateData)

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()

    // Perform the update
    const { data: result, error } = await supabase.from("fire_zones").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Update successful:", result)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
