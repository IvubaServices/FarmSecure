"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
// import "leaflet/dist/leaflet.css" // Removed: CSS is now loaded in app/layout.tsx
import L from "leaflet"
import { Card } from "@/components/ui/card"

// Fix Leaflet icon issues
const fixLeafletIcon = () => {
  // Fix for default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Create a custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="map-icon location-marker-icon"></div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

// Component to update map center when props change
function MapUpdater({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], map.getZoom())
    }
  }, [latitude, longitude, map])

  return null
}

// Component to handle map clicks and update location
function LocationMarker({ position, onLocationChange }) {
  const markerRef = useRef(null)

  // Set up map event handlers
  const map = useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })

  // Make the marker draggable
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      marker.dragging.enable()

      // Add event listener for drag end
      marker.on("dragend", (e) => {
        const marker = e.target
        const position = marker.getLatLng()
        onLocationChange(position.lat, position.lng)
      })
    }
  }, [markerRef, onLocationChange])

  return position.lat !== 0 && position.lng !== 0 ? (
    <Marker position={position} ref={markerRef} icon={createMarkerIcon()} />
  ) : null
}

// Main component
export default function LocationMapContent({ latitude, longitude, onLocationChange }) {
  // Fix Leaflet icon issues
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  // Default center if no coordinates provided
  const center = latitude && longitude ? [latitude, longitude] : [-25.7479, 28.2293]

  return (
    <Card className="w-full h-[300px] overflow-hidden">
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater latitude={latitude} longitude={longitude} />
        <LocationMarker position={{ lat: latitude, lng: longitude }} onLocationChange={onLocationChange} />
      </MapContainer>
    </Card>
  )
}
