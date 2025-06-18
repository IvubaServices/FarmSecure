"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
// import "leaflet/dist/leaflet.css" // Removed: CSS is now loaded in app/layout.tsx
import L from "leaflet"

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

// Component to handle map clicks and update location
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position ? <Marker position={position} icon={createMarkerIcon()} /> : null
}

// Main component
export default function MapSelectorContent({ onSelectLocation, initialLatitude, initialLongitude }) {
  // Default center if no coordinates provided
  const defaultCenter = [-25.7479, 28.2293]
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLatitude && initialLongitude ? L.latLng(initialLatitude, initialLongitude) : null,
  )

  // Fix Leaflet icon issues
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  // Update parent component when position changes
  useEffect(() => {
    if (position) {
      onSelectLocation(position.lat, position.lng)
    }
  }, [position, onSelectLocation])

  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  )
}
