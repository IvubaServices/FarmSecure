"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function updateFireZone(formData: FormData) {
  try {
    const id = formData.get("id") as string
    if (!id) {
      throw new Error("Fire zone ID is required")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const latitude = Number.parseFloat(formData.get("latitude") as string)
    const longitude = Number.parseFloat(formData.get("longitude") as string)
    const severity = formData.get("severity") as string
    const status = formData.get("status") as string

    // Validate data
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid coordinates")
    }

    if (!name || !severity || !status) {
      throw new Error("Missing required fields")
    }

    // Use server-side Supabase client with service role
    const supabase = createServerSupabaseClient()

    // Update the fire zone
    const { error } = await supabase
      .from("fire_zones")
      .update({
        name,
        description,
        latitude,
        longitude,
        severity,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Supabase update error:", error)
      throw new Error(`Failed to update fire zone: ${error.message}`)
    }

    // Revalidate the fire zones pages to refresh data
    revalidatePath("/fire-zones")
    revalidatePath(`/fire-zones/${id}`)

    return { success: true, message: "Fire zone updated successfully" }
  } catch (error) {
    console.error("Server action error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update fire zone",
    }
  }
}
