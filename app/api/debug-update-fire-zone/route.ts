import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request) {
  try {
    const data = await request.json()
    console.log("DEBUG API received data:", data)

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

    console.log("DEBUG Updating fire zone ID:", id)
    console.log("DEBUG Update data:", updateData)

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()

    // Get the current data first for debugging
    const { data: currentData, error: fetchError } = await supabase.from("fire_zones").select("*").eq("id", id).single()

    if (fetchError) {
      console.error("DEBUG Supabase fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: fetchError.message,
          details: "Failed to fetch current data",
          code: fetchError.code,
        },
        { status: 500 },
      )
    }

    console.log("DEBUG Current data:", currentData)

    // Perform the update with detailed error handling
    const { data: result, error } = await supabase.from("fire_zones").update(updateData).eq("id", id).select()

    if (error) {
      console.error("DEBUG Supabase update error:", error)

      // Check for RLS policy violations
      if (error.code === "42501") {
        return NextResponse.json(
          {
            success: false,
            error: "Permission denied. Row-level security policy is preventing the update.",
            details: error.message,
            code: error.code,
          },
          { status: 403 },
        )
      }

      // Check for constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Unique constraint violation. This value already exists.",
            details: error.message,
            code: error.code,
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Update failed",
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("DEBUG Update successful:", result)
    return NextResponse.json({
      success: true,
      data: result,
      message: "Fire zone updated successfully",
    })
  } catch (error) {
    console.error("DEBUG API route error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        details: "Unexpected error in API route",
      },
      { status: 500 },
    )
  }
}
