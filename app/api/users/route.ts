import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get query parameters
    const url = new URL(request.url)
    const role = url.searchParams.get("role")
    const status = url.searchParams.get("status")
    const team = url.searchParams.get("team")

    // Start building the query
    let query = supabase.from("users").select("*")

    // Add filters if provided
    if (role) {
      query = query.eq("role", role)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (team) {
      query = query.eq("team", team)
    }

    // Execute the query
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.full_name || !body.role || !body.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert the new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: body.email,
          full_name: body.full_name,
          role: body.role,
          team: body.team,
          status: body.status,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ user: data[0] })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
