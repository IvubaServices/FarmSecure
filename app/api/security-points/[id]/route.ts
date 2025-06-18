import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request, { params }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Missing security point ID" }, { status: 400 })
    }

    // Validate that the ID is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid security point ID format" }, { status: 400 })
    }

    // Create the Supabase client with proper error handling
    let supabase
    try {
      supabase = createServerSupabaseClient()
    } catch (initError) {
      console.error("Failed to initialize Supabase client:", initError)
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Add timeout to the query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 10000),
    )

    // Execute the query with a timeout
    const queryPromise = supabase.from("security_points").select("*").eq("id", id).single()

    // Race between the query and the timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => ({ data: null, error: new Error("Query timed out") })),
    ])

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json(
        {
          error: error.message || "Database query failed",
          details: error.details || "No additional details",
        },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Security point not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: error.message || "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
