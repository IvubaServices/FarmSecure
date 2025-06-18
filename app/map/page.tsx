"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FullMapView } from "@/components/full-map-view"
import { MapConfigSelector } from "@/components/map-config-selector"
import { MapPin, Users } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { Loading } from "@/components/loading"
import type { MapConfig } from "@/lib/map-utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function MapPage() {
  const { fireZones, securityPoints, teamMembers, isLoading } = useRealtime()
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [showTeamMembers, setShowTeamMembers] = useState(true)

  useEffect(() => {
    const fetchMapConfig = async () => {
      setIsLoadingConfig(true)
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
        } else if (mapConfigResponse.error) {
          console.error("Error fetching map config:", mapConfigResponse.error)
          // Don't set mapConfig to null, let it use default values
        }
      } catch (error) {
        console.error("Error in fetchMapConfig:", error)
        // Don't set mapConfig to null, let it use default values
      } finally {
        setIsLoadingConfig(false)
      }
    }

    fetchMapConfig()
  }, [])

  if (isLoading || isLoadingConfig) {
    return <Loading message="Loading map data..." />
  }

  // Filter team members to only show active fire team members
  const activeTeamMembers = showTeamMembers
    ? teamMembers.filter((member) => member.is_on_map && (member.status === "Active" || member.status === "On Call"))
    : []

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Map View</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="show-team" checked={showTeamMembers} onCheckedChange={setShowTeamMembers} />
            <Label htmlFor="show-team" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Show Team Members
            </Label>
          </div>
          <MapConfigSelector />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Interactive Farm Map
            {mapConfig && <span className="ml-2 text-sm font-normal text-muted-foreground">({mapConfig.name})</span>}
          </CardTitle>
          <CardDescription>
            {mapConfig?.description || "View all fire zones and security points"}
            {showTeamMembers && activeTeamMembers.length > 0 && (
              <span className="ml-1">
                and {activeTeamMembers.length} active team member{activeTeamMembers.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-250px)] w-full">
            <FullMapView
              fireZones={fireZones}
              securityPoints={securityPoints}
              teamMembers={activeTeamMembers}
              mapConfig={
                mapConfig || {
                  centerLatitude: -25.7479,
                  centerLongitude: 28.2293,
                  defaultZoom: 10,
                  minZoom: 3,
                  maxZoom: 18,
                }
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
