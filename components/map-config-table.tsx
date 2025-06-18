"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function MapConfigTable({ initialMapConfigs }) {
  const [mapConfigs, setMapConfigs] = useState(initialMapConfigs)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClientSupabaseClient()

    // Set up real-time subscription
    const channel = supabase
      .channel("map-config-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_config",
        },
        async (payload) => {
          console.log("Real-time update received:", payload)
          setLoading(true)

          try {
            // Fetch fresh data
            const { data } = await supabase.from("map_config").select("*").order("created_at", { ascending: false })

            if (data) {
              setMapConfigs(data)
            }
          } catch (error) {
            console.error("Error fetching updated map configs:", error)
          } finally {
            setLoading(false)
          }
        },
      )
      .subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-0 right-0 p-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Center Coordinates</TableHead>
            <TableHead>Zoom</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mapConfigs.length > 0 ? (
            mapConfigs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">{config.name}</TableCell>
                <TableCell>
                  {config.center_latitude.toFixed(4)}, {config.center_longitude.toFixed(4)}
                </TableCell>
                <TableCell>{config.default_zoom}</TableCell>
                <TableCell>
                  {config.is_active ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/settings/map-config/${config.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No map configurations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
