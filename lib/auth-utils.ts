import type { User } from "firebase/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

/**
 * Syncs a Firebase user with the Supabase users table
 * Creates or updates the user record in Supabase with Firebase UID
 */
export async function syncUserWithSupabase(
  firebaseUser: User,
  userData?: {
    name?: string
    role?: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", firebaseUser.email)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking for existing user:", fetchError)
      return null
    }

    if (existingUser) {
      // Update existing user with Firebase UID if needed
      if (!existingUser.firebase_uid) {
        const { data, error } = await supabase
          .from("users")
          .update({
            firebase_uid: firebaseUser.uid,
            // Only update these fields if provided
            ...(userData?.name && { name: userData.name }),
            ...(userData?.role && { role: userData.role }),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating user with Firebase UID:", error)
          return null
        }

        return data
      }

      return existingUser
    } else {
      // Create new user in Supabase
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0],
          firebase_uid: firebaseUser.uid,
          role: userData?.role || "user", // Default role
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating user in Supabase:", error)
        return null
      }

      return data
    }
  } catch (error) {
    console.error("Error syncing user with Supabase:", error)
    return null
  }
}

/**
 * Gets a user's role from Supabase based on Firebase UID
 */
export async function getUserRole(firebaseUid: string): Promise<string> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("users").select("role").eq("firebase_uid", firebaseUid).single()

    if (error) {
      console.error("Error fetching user role:", error)
      return "guest"
    }

    return data?.role || "guest"
  } catch (error) {
    console.error("Error getting user role:", error)
    return "guest"
  }
}
