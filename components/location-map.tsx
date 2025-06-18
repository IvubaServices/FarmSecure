"use client"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"

// Define props for the LocationMapContent component
interface LocationMapContentProps {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number) => void
}

// Create a wrapper component that will dynamically import the map content
export function LocationMap({ latitude, longitude, onLocationChange }: LocationMapContentProps) {
  // Dynamically import the map content component to avoid SSR issues
  const DynamicMap = dynamic(() => import("./location-map-content"), {
    ssr: false,
    loading: () => (
      <Card className="w-full h-[300px] flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </Card>
    ),
  })

  return <DynamicMap latitude={latitude} longitude={longitude} onLocationChange={onLocationChange} />
}
