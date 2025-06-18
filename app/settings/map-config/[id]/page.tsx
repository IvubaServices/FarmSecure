import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"
import { MapConfigForm } from "@/components/map-config-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

async function getMapConfig(id) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("map_config").select("*").eq("id", id).single()

  if (error || !data) {
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

export default async function EditMapConfigPage({ params }) {
  const mapConfig = await getMapConfig(params.id)

  if (!mapConfig) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Map Configuration</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Edit: {mapConfig.name}
          </CardTitle>
          <CardDescription>Update map configuration settings</CardDescription>
        </CardHeader>
        <CardContent>
          <MapConfigForm initialData={mapConfig} />
        </CardContent>
      </Card>
    </div>
  )
}
