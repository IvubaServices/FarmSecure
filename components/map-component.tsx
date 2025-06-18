"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
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

// Create custom icons using simple HTML
const createFireIcon = (status) => {
  let colorClass = "fire-icon" // Default red for Active

  if (status === "Contained") {
    colorClass = "fire-icon-contained" // Orange for Contained
  } else if (status === "Extinguished") {
    colorClass = "fire-icon-extinguished" // Green for Extinguished
  }

  return L.divIcon({
    html: `<div class="map-icon ${colorClass}"></div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

const createSecurityIcon = (status) => {
  // Use different class based on status
  const iconClass = status === "Alert" ? "security-icon-alert" : "security-icon"

  return L.divIcon({
    html: `<div class="map-icon ${iconClass}"></div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

const createFireTeamIcon = () => {
  return L.divIcon({
    html: `<div class="map-icon fire-team-icon"></div>`,
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

const createSecurityTeamIcon = () => {
  return L.divIcon({
    html: `<div class="map-icon security-team-icon"></div>`,
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Map bounds adjuster
function MapBoundsAdjuster({ fireZones, securityPoints, teamMembers, mapConfig }) {
  const map = useMap()

  useEffect(() => {
    if (mapConfig && typeof mapConfig === "object") {
      // If we have map bounds in the config, use them
      if (
        mapConfig.boundsNorth !== null &&
        mapConfig.boundsSouth !== null &&
        mapConfig.boundsEast !== null &&
        mapConfig.boundsWest !== null &&
        typeof mapConfig.boundsNorth === "number" &&
        typeof mapConfig.boundsSouth === "number" &&
        typeof mapConfig.boundsEast === "number" &&
        typeof mapConfig.boundsWest === "number"
      ) {
        const bounds = L.latLngBounds(
          [mapConfig.boundsNorth, mapConfig.boundsWest],
          [mapConfig.boundsSouth, mapConfig.boundsEast],
        )
        map.fitBounds(bounds, { padding: [50, 50] })
        return
      }

      // If no bounds but we have center coordinates, use them
      if (
        typeof mapConfig.centerLatitude === "number" &&
        typeof mapConfig.centerLongitude === "number" &&
        typeof mapConfig.defaultZoom === "number"
      ) {
        map.setView([mapConfig.centerLatitude, mapConfig.centerLongitude], mapConfig.defaultZoom)
        return
      }
    }

    // Fallback: If no config or points, use default view
    if (fireZones.length === 0 && securityPoints.length === 0 && (!teamMembers || teamMembers.length === 0)) {
      map.setView([-25.7479, 28.2293], 8)
      return
    }

    // Fallback: If we have points but no config, fit to points
    const allPoints = [
      ...fireZones.map((zone) => [zone.latitude, zone.longitude]),
      ...securityPoints.map((point) => [point.latitude, point.longitude]),
      ...(teamMembers || [])
        .filter((member) => member.latitude && member.longitude)
        .map((member) => [member.latitude, member.longitude]),
    ]

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, fireZones, securityPoints, teamMembers, mapConfig])

  return null
}

// Severity to color mapping
const getSeverityColor = (severity) => {
  switch (severity) {
    case "Critical":
      return "text-red-600"
    case "High":
      return "text-orange-500"
    case "Medium":
      return "text-amber-400"
    case "Low":
      return "text-yellow-300"
    default:
      return "text-gray-500"
  }
}

// Status to color mapping
const getStatusColor = (status) => {
  switch (status) {
    case "Alert":
      return "text-red-500"
    case "Active":
      return "text-green-500"
    case "Inactive":
      return "text-gray-400"
    default:
      return "text-gray-500"
  }
}

// Main component
export default function MapComponent({
  fireZones = [],
  securityPoints = [],
  teamMembers = [],
  height = "100vh",
  mapConfig = null,
}) {
  const [securityIcon, setSecurityIcon] = useState(null)
  const [fireTeamIcon, setFireTeamIcon] = useState(null)
  const [securityTeamIcon, setSecurityTeamIcon] = useState(null)
  const [cssInjected, setCssInjected] = useState(false)

  // Provide default values if mapConfig is null or incomplete
  const defaultCenter =
    mapConfig && typeof mapConfig.centerLatitude === "number" && typeof mapConfig.centerLongitude === "number"
      ? [mapConfig.centerLatitude, mapConfig.centerLongitude]
      : [-25.7479, 28.2293]

  const defaultZoom = mapConfig && typeof mapConfig.defaultZoom === "number" ? mapConfig.defaultZoom : 8

  const minZoom = mapConfig && typeof mapConfig.minZoom === "number" ? mapConfig.minZoom : 3

  const maxZoom = mapConfig && typeof mapConfig.maxZoom === "number" ? mapConfig.maxZoom : 18

  useEffect(() => {
    try {
      fixLeafletIcon()
      setSecurityIcon(createSecurityIcon("Normal"))
      setFireTeamIcon(createFireTeamIcon())
      setSecurityTeamIcon(createSecurityTeamIcon())

      // Add CSS for map icons if it doesn't exist
      if (!cssInjected) {
        const style = document.createElement("style")
        style.textContent = `
          .map-icon {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.3);
          }
          .fire-icon {
            background-color: #ef4444;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 18px;
          }
          .fire-icon-contained {
            background-color: #f97316;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 18px;
          }
          .fire-icon-extinguished {
            background-color: #22c55e;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 18px;
          }
          .security-icon {
            background-color: #3b82f6;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 18px;
          }
          .security-icon-alert {
            background-color: #f97316;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 18px;
          }
          .fire-team-icon {
            background-color: #dc2626;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M22 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 16px;
          }
          .security-team-icon {
            background-color: #2563eb;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M22 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 16px;
          }
        `
        document.head.appendChild(style)
        setCssInjected(true)
      }
    } catch (error) {
      console.error("Error initializing map icons:", error)
    }
  }, [cssInjected])

  if (!securityIcon || !fireTeamIcon || !securityTeamIcon) {
    return <div className="h-full w-full bg-muted flex items-center justify-center">Loading map resources...</div>
  }

  // Filter team members to only show those with location data and who are active
  const activeTeamMembers = teamMembers.filter(
    (member) =>
      member.latitude &&
      member.longitude &&
      member.is_on_map &&
      (member.status === "Active" || member.status === "On Call"),
  )

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height, width: "100%" }}
      className="z-0"
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsAdjuster
        fireZones={fireZones}
        securityPoints={securityPoints}
        teamMembers={activeTeamMembers}
        mapConfig={mapConfig}
      />

      {fireZones.map((zone) => (
        <Marker key={zone.id} position={[zone.latitude, zone.longitude]} icon={createFireIcon(zone.status)}>
          <Popup>
            <div className="p-1">
              <h3 className="font-bold">{zone.name}</h3>
              <p className={`font-medium ${getSeverityColor(zone.severity)}`}>Severity: {zone.severity}</p>
              <p>Status: {zone.status}</p>
              {zone.description && <p className="text-sm mt-1">{zone.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {securityPoints.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={point.status === "Alert" ? createSecurityIcon("Alert") : securityIcon}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold">{point.name}</h3>
              <p className={`font-medium ${getStatusColor(point.status)}`}>Status: {point.status}</p>
              <p>Type: {point.type}</p>
              {point.description && <p className="text-sm mt-1">{point.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {activeTeamMembers.map((member) => (
        <Marker
          key={`team-${member.id}`}
          position={[member.latitude, member.longitude]}
          icon={member.team === "Fire" ? fireTeamIcon : securityTeamIcon}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold">{member.name}</h3>
              <p className="font-medium">Role: {member.role}</p>
              <p className={`font-medium ${getStatusColor(member.status)}`}>Status: {member.status}</p>
              <p>Team: {member.team}</p>
              <p className="text-sm mt-1">
                <a href={`tel:${member.phone}`} className="text-blue-500 hover:underline">
                  Call: {member.phone}
                </a>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
