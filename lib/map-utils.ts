import { createServerSupabaseClient } from "./supabase"

export type MapConfig = {
  id: string
  name: string
  description: string | null
  centerLatitude: number
  centerLongitude: number
  defaultZoom: number
  minZoom: number
  maxZoom: number
  boundsNorth: number | null
  boundsSouth: number | null
  boundsEast: number | null
  boundsWest: number | null
  isActive: boolean
}

export async function getActiveMapConfig(): Promise<MapConfig | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("map_config")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("Error fetching map config:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    centerLatitude: data.center_latitude,
    centerLongitude: data.center_longitude,
    defaultZoom: data.default_zoom,
    minZoom: data.min_zoom,
    maxZoom: data.max_zoom,
    boundsNorth: data.bounds_north,
    boundsSouth: data.bounds_south,
    boundsEast: data.bounds_east,
    boundsWest: data.bounds_west,
    isActive: data.is_active,
  }
}
