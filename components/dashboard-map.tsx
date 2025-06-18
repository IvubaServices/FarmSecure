"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import dynamic from "next/dynamic"
import type { MapConfig } from "@/lib/map-utils"
import { useRealtime } from "@/contexts/realtime-context"

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted">Loading map...</div>,
})

export function DashboardMap() {
  const { fireZones, securityPoints, teamMembers } = useRealtime()
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMapConfig = async () => {
      setIsLoading(true)
      try {
        const supabase = createClientSupabaseClient()

        const mapConfigResponse = await supabase
          .from("map_config")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (mapConfigResponse.data) {
          setMapConfig({
            id: mapConfigResponse.data.id,
            name: mapConfigResponse.data.name,
            description: mapConfigResponse.data.description,
            centerLatitude: mapConfigResponse.data.center_latitude,
            centerLongitude: mapConfigResponse.data.center_longitude,
            defaultZoom: mapConfigResponse.data.default_zoom,
            minZoom: mapConfigResponse.data.min_zoom,
            maxZoom: mapConfigResponse.data.max_zoom,
            boundsNorth: mapConfigResponse.data.bounds_north,
            boundsSouth: mapConfigResponse.data.bounds_south,
            boundsEast: mapConfigResponse.data.bounds_east,
            boundsWest: mapConfigResponse.data.bounds_west,
            isActive: mapConfigResponse.data.is_active,
          })
        } else {
          console.log("No active map config found, using defaults")
        }
      } catch (error) {
        console.error("Error fetching map config:", error)
        // Continue with null mapConfig, component will use defaults
      } finally {
        setIsLoading(false)
      }
    }

    fetchMapConfig()
  }, [])

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center bg-muted">Loading map data...</div>
  }

  // Filter team members to only show active fire team members
  const activeTeamMembers = teamMembers.filter(
    (member) => member.is_on_map && (member.status === "Active" || member.status === "On Call"),
  )

  return (
    <MapComponent
      fireZones={fireZones}
      securityPoints={securityPoints}
      teamMembers={activeTeamMembers}
      height="500px"
      mapConfig={mapConfig}
    />
  )
}
