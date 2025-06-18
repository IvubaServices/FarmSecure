"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Map } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues with Leaflet
const DynamicMapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-muted">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

interface MapViewButtonProps {
  latitude: number
  longitude: number
  name?: string
  description?: string
  status?: string
  severity?: string
  reportedAt?: string
  type?: string // Add this line to identify if it's a security point or fire zone
}

export function MapViewButton({
  latitude,
  longitude,
  name,
  description,
  status,
  severity,
  reportedAt,
  type,
}: MapViewButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Map className="h-4 w-4 mr-1" />
          View Map
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{name ? `Location: ${name}` : "Location Map"}</DialogTitle>
        </DialogHeader>
        <div className="h-[500px] w-full">
          <DynamicMapView
            latitude={latitude}
            longitude={longitude}
            name={name}
            description={description}
            status={status}
            severity={severity}
            reportedAt={reportedAt}
            type={type}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
