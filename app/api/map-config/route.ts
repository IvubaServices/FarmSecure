import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request) {
  try {
    const data = await request.json()
    console.log("API: Received map config data:", data)

    const supabase = createServerSupabaseClient()

    // Handle insert with server-side client
    const { data: insertedData, error } = await supabase
      .from("map_config")
      .insert({
        name: data.name,
        description: data.description,
        center_latitude: data.centerLatitude,
        center_longitude: data.centerLongitude,
        default_zoom: data.defaultZoom,
        min_zoom: data.minZoom,
        max_zoom: data.maxZoom,
        bounds_north: data.boundsNorth || null,
        bounds_south: data.boundsSouth || null,
        bounds_east: data.boundsEast || null,
        bounds_west: data.boundsWest || null,
        is_active: data.isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("API: Error inserting map config:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("API: Insert successful:", insertedData)

    // If setting this config as active, deactivate all others
    if (data.isActive && insertedData && insertedData[0]) {
      const newId = insertedData[0].id
      const { error: deactivateError } = await supabase.from("map_config").update({ is_active: false }).neq("id", newId)

      if (deactivateError) {
        console.warn("API: Error deactivating other configs:", deactivateError)
      }
    }

    return NextResponse.json({ success: true, data: insertedData })
  } catch (error) {
    console.error("API: Error in map-config API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()
    console.log("API: Received map config update data:", data)

    if (!data.id) {
      return NextResponse.json({ error: "ID is required for updates" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Handle update with server-side client
    const { data: updatedData, error } = await supabase
      .from("map_config")
      .update({
        name: data.name,
        description: data.description,
        center_latitude: data.centerLatitude,
        center_longitude: data.centerLongitude,
        default_zoom: data.defaultZoom,
        min_zoom: data.minZoom,
        max_zoom: data.maxZoom,
        bounds_north: data.boundsNorth || null,
        bounds_south: data.boundsSouth || null,
        bounds_east: data.boundsEast || null,
        bounds_west: data.boundsWest || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()

    if (error) {
      console.error("API: Error updating map config:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("API: Update successful:", updatedData)

    // If setting this config as active, deactivate all others
    if (data.isActive) {
      const { error: deactivateError } = await supabase
        .from("map_config")
        .update({ is_active: false })
        .neq("id", data.id)

      if (deactivateError) {
        console.warn("API: Error deactivating other configs:", deactivateError)
      }
    }

    return NextResponse.json({ success: true, data: updatedData })
  } catch (error) {
    console.error("API: Error in map-config API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("map_config").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("API: Error fetching map configs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("API: Error in map-config API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
