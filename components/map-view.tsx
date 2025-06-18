"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet icon issues
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Create custom fire icon
const createFireIcon = (status: string) => {
  return L.divIcon({
    html: `<div class="map-icon fire-icon ${status.toLowerCase()}"></div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

// Create custom security icon
const createSecurityIcon = (status?: string) => {
  // Use orange background for Alert status
  const iconClass = status === "Alert" ? "security-icon-alert" : "security-icon"

  return L.divIcon({
    html: `<div class="map-icon ${iconClass}"></div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

interface MapViewProps {
  latitude: number
  longitude: number
  name?: string
  description?: string
  status?: string
  severity?: string
  reportedAt?: string
  type?: string
}

export default function MapView({
  latitude,
  longitude,
  name,
  description,
  status,
  severity,
  reportedAt,
  type,
}: MapViewProps) {
  useEffect(() => {
    fixLeafletIcon()

    // Add the security-icon-alert class to the document if it doesn't exist
    if (!document.querySelector(".security-icon-alert")) {
      const style = document.createElement("style")
      style.textContent = `
        .security-icon-alert {
          background-color: #f97316; /* Orange color for Alert status */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E");
          background-position: center;
          background-repeat: no-repeat;
          background-size: 18px;
          border: 2px solid white;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: "100%", width: "100%" }} className="z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[latitude, longitude]}
        icon={type === "security" ? createSecurityIcon(status) : createFireIcon(status || "Active")}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold">{name || "Fire Zone"}</h3>
            {description && (
              <div className="mt-1 flex">
                <span className="font-medium mr-1">Description:</span>
                <span className="truncate">{description}</span>
              </div>
            )}
            {status && (
              <div>
                <span className="font-medium">Status:</span> {status}
              </div>
            )}
            {severity && (
              <div>
                <span className="font-medium">Severity:</span> {severity}
              </div>
            )}
            {reportedAt && (
              <div>
                <span className="font-medium">Reported:</span> {new Date(reportedAt).toLocaleDateString()}
              </div>
            )}
            <div className="mt-1">
              <span className="font-medium">Coordinates:</span> {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
