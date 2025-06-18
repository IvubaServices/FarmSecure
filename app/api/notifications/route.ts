import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const timeFrame = searchParams.get("timeFrame")
    const search = searchParams.get("search")

    const supabase = createServerSupabaseClient()

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (severity && severity !== "all") {
      query = query.eq("severity", severity)
    }

    if (timeFrame && timeFrame !== "all") {
      const now = new Date()
      let timeAgo: Date

      switch (timeFrame) {
        case "today":
          timeAgo = new Date(now.setHours(0, 0, 0, 0))
          break
        case "week":
          timeAgo = new Date(now.setDate(now.getDate() - 7))
          break
        case "month":
          timeAgo = new Date(now.setMonth(now.getMonth() - 1))
          break
        default:
          timeAgo = new Date(0) // Beginning of time
      }

      query = query.gte("created_at", timeAgo.toISOString())
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type")
    const all = searchParams.get("all")

    const supabase = createServerSupabaseClient()

    const query = supabase.from("notifications")

    if (all === "true") {
      // Delete all notifications
      const { error } = await query.delete().neq("id", "placeholder")

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (id) {
      // Delete specific notification
      const { error } = await query.delete().eq("id", id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (type && type !== "all") {
      // Delete notifications by type
      const { error } = await query.delete().eq("type", type)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Invalid delete parameters" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, read } = body

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").update({ read }).eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
