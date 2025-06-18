"use client"

import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted">Loading map...</div>,
})

export function FullMapView({ fireZones, securityPoints, teamMembers, mapConfig }) {
  return (
    <MapComponent
      fireZones={fireZones}
      securityPoints={securityPoints}
      teamMembers={teamMembers}
      height="calc(100vh - 250px)"
      mapConfig={mapConfig}
    />
  )
}
