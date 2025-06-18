"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MapPin, PlusCircle } from "lucide-react"
import { MapConfigTable } from "@/components/map-config-table"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function MapConfigPage() {
  const [mapConfigs, setMapConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMapConfigs() {
      setLoading(true)
      try {
        const supabase = createClientSupabaseClient()
        const { data } = await supabase.from("map_config").select("*").order("created_at", { ascending: false })
        setMapConfigs(data || [])
      } catch (error) {
        console.error("Error fetching map configs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMapConfigs()

    // Set up real-time subscription at the page level
    const supabase = createClientSupabaseClient()
    const channel = supabase
      .channel("map-config-page-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_config",
        },
        () => {
          console.log("Real-time update received at page level")
          fetchMapConfigs()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Map Configurations</h1>
        <Button asChild>
          <Link href="/settings/map-config/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Map Configuration
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Map Settings
          </CardTitle>
          <CardDescription>Manage map configurations for different farm areas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MapConfigTable initialMapConfigs={mapConfigs} key={`map-configs-${new Date().getTime()}`} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
