"use server"

import { createClient } from "@supabase/supabase-js"
// This client uses the SERVICE_ROLE_KEY and is meant for server-side operations
// that need to bypass RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL is public
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Key is server-only, NOT NEXT_PUBLIC_
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)

import type { LiveFeedSetting, CreateLiveFeedSettingData, UpdateLiveFeedSettingData } from "@/types/live-feed"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stream_url: z.string().url("Invalid URL format"),
  display_order: z.coerce.number().int().min(0, "Display order must be a non-negative integer"),
  is_enabled: z.boolean(),
})

export async function getLiveFeedSettings(): Promise<LiveFeedSetting[]> {
  console.log("[Action:getLiveFeedSettings] Attempting to fetch settings using ADMIN client...")

  const { data, error, count } = await supabaseAdmin
    .from("live_feed_settings")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .order("title", { ascending: true })

  if (error) {
    console.error("[Action:getLiveFeedSettings] FATAL ERROR fetching live feed settings:", error)
    throw new Error(`Failed to fetch live feed settings from Supabase: ${error.message}`)
  }

  console.log(`[Action:getLiveFeedSettings] Successfully fetched data with admin client. Row count: ${count}`)
  return data || []
}

export async function createLiveFeedSetting(
  formData: CreateLiveFeedSettingData,
): Promise<{ success: boolean; errors?: z.ZodIssue[] }> {
  console.log("[Action:createLiveFeedSetting] Attempting to create setting using ADMIN client...")
  const validation = formSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, errors: validation.error.errors }
  }

  const { error } = await supabaseAdmin.from("live_feed_settings").insert([validation.data])

  if (error) {
    console.error("Error creating live feed setting with admin client:", error)
    if (error.code === "23505") {
      return { success: false, errors: [{ path: ["stream_url"], message: "This stream URL already exists." }] }
    }
    throw new Error(`Failed to create live feed setting: ${error.message}`)
  }

  console.log("[Action:createLiveFeedSetting] Successfully created setting.")
  revalidatePath("/settings/live-feeds")
  revalidatePath("/live-feeds")
  return { success: true }
}

export async function updateLiveFeedSetting(
  id: string,
  formData: UpdateLiveFeedSettingData,
): Promise<{ success: boolean; errors?: z.ZodIssue[] }> {
  console.log(`[Action:updateLiveFeedSetting] Attempting to update setting ID: ${id} using ADMIN client...`)
  const validation = formSchema.partial().safeParse(formData)
  if (!validation.success) {
    return { success: false, errors: validation.error.errors }
  }

  if (Object.keys(validation.data).length === 0) {
    console.log("[Action:updateLiveFeedSetting] No data to update.")
    return { success: true }
  }

  const { error } = await supabaseAdmin.from("live_feed_settings").update(validation.data).eq("id", id)

  if (error) {
    console.error(`Error updating live feed setting ID: ${id} with admin client:`, error)
    if (error.code === "23505" && error.message && error.message.includes("live_feed_settings_stream_url_key")) {
      return {
        success: false,
        errors: [
          {
            path: ["stream_url"],
            message: "This stream URL is already in use by another feed. Please choose a different URL.",
          },
        ],
      }
    }
    if (error.code === "23505") {
      return {
        success: false,
        errors: [
          {
            path: [],
            message: "A unique value constraint was violated. The entered value may already exist.",
          },
        ],
      }
    }
    throw new Error(`Failed to update live feed setting: ${error.message}`)
  }

  console.log(`[Action:updateLiveFeedSetting] Successfully updated setting ID: ${id}.`)
  revalidatePath("/settings/live-feeds")
  revalidatePath("/live-feeds")
  return { success: true }
}

export async function deleteLiveFeedSetting(id: string): Promise<{ success: boolean }> {
  console.log(`[Action:deleteLiveFeedSetting] Attempting to delete setting ID: ${id} using ADMIN client...`)
  const { error } = await supabaseAdmin.from("live_feed_settings").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting live feed setting ID: ${id} with admin client:`, error)
    throw new Error(`Failed to delete live feed setting: ${error.message}`)
  }

  console.log(`[Action:deleteLiveFeedSetting] Successfully deleted setting ID: ${id}.`)
  revalidatePath("/settings/live-feeds")
  revalidatePath("/live-feeds")
  return { success: true }
}
