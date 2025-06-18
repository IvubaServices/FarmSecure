import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Crucially, this is SUPABASE_SERVICE_ROLE_KEY
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)

// ... rest of the file (GET handler)
// Ensure the full GET handler is present as per previous correct versions.
// For brevity, I'm only showing the client initialization.

export async function GET() {
  console.log("[API /api/live-feed-settings] Attempting to fetch settings using ADMIN client...")
  try {
    const { data, error, count } = await supabaseAdmin
      .from("live_feed_settings")
      .select("id, title, stream_url")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true })
      .order("title", { ascending: true })

    if (error) {
      console.error("[API /api/live-feed-settings] Error fetching live feed settings:", error)
      return NextResponse.json({ error: `Failed to fetch live feed settings: ${error.message}` }, { status: 500 })
    }

    console.log(`[API /api/live-feed-settings] Successfully fetched data. Row count: ${count}`)
    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error("[API /api/live-feed-settings] Catch block error:", err)
    return NextResponse.json({ error: `An unexpected error occurred: ${err.message}` }, { status: 500 })
  }
}
