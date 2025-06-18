"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRealtime } from "@/contexts/realtime-context"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Notification = {
  id: string
  type: "fire" | "security"
  title: string
  message: string
  timestamp: Date
}

export function RealtimeNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [visibleNotification, setVisibleNotification] = useState<Notification | null>(null)
  const { fireZones, securityPoints } = useRealtime()

  // Use refs to track previous values to avoid unnecessary updates
  const prevFireZonesRef = useRef<string>("")
  const prevSecurityPointsRef = useRef<string>("")

  // Process fire zones for changes
  useEffect(() => {
    if (fireZones.length === 0) return

    // Convert to JSON string for comparison
    const currentFireZonesJson = JSON.stringify(fireZones.map((z) => ({ id: z.id, updated_at: z.updated_at })))

    // Skip if nothing changed
    if (currentFireZonesJson === prevFireZonesRef.current) return

    // Update the ref
    prevFireZonesRef.current = currentFireZonesJson

    // Check for new or updated fire zones in the last minute
    const now = new Date()
    const recentFireZones = fireZones.filter((zone) => {
      const updatedAt = new Date(zone.updated_at)
      const timeDiff = now.getTime() - updatedAt.getTime()
      return timeDiff < 60000 // Less than a minute
    })

    if (recentFireZones.length > 0) {
      const newNotifications = recentFireZones.map((zone) => ({
        id: `fire-${zone.id}-${new Date(zone.updated_at).getTime()}`,
        type: "fire" as const,
        title: "Fire Zone Update",
        message: `${zone.name} - ${zone.status} (${zone.severity})`,
        timestamp: new Date(zone.updated_at),
      }))

      setNotifications((prev) => {
        // Filter out duplicates
        const existingIds = prev.map((n) => n.id)
        const uniqueNew = newNotifications.filter((n) => !existingIds.includes(n.id))
        return [...uniqueNew, ...prev].slice(0, 10) // Keep only the 10 most recent
      })
    }
  }, [fireZones])

  // Process security points for changes
  useEffect(() => {
    if (securityPoints.length === 0) return

    // Convert to JSON string for comparison
    const currentSecurityPointsJson = JSON.stringify(
      securityPoints.map((p) => ({ id: p.id, updated_at: p.updated_at })),
    )

    // Skip if nothing changed
    if (currentSecurityPointsJson === prevSecurityPointsRef.current) return

    // Update the ref
    prevSecurityPointsRef.current = currentSecurityPointsJson

    // Check for new or updated security points in the last minute
    const now = new Date()
    const recentSecurityPoints = securityPoints.filter((point) => {
      const updatedAt = new Date(point.updated_at)
      const timeDiff = now.getTime() - updatedAt.getTime()
      return timeDiff < 60000 // Less than a minute
    })

    if (recentSecurityPoints.length > 0) {
      const newNotifications = recentSecurityPoints.map((point) => ({
        id: `security-${point.id}-${new Date(point.updated_at).getTime()}`,
        type: "security" as const,
        title: "Security Point Update",
        message: `${point.name} - ${point.status} (${point.type})`,
        timestamp: new Date(point.updated_at),
      }))

      setNotifications((prev) => {
        // Filter out duplicates
        const existingIds = prev.map((n) => n.id)
        const uniqueNew = newNotifications.filter((n) => !existingIds.includes(n.id))
        return [...uniqueNew, ...prev].slice(0, 10) // Keep only the 10 most recent
      })
    }
  }, [securityPoints])

  // Show notifications one at a time
  useEffect(() => {
    if (notifications.length > 0 && !visibleNotification) {
      setVisibleNotification(notifications[0])
    }
  }, [notifications, visibleNotification])

  const dismissNotification = useCallback(() => {
    setNotifications((prev) => prev.slice(1))
    setVisibleNotification(null)
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visibleNotification) return

    const timer = setTimeout(() => {
      dismissNotification()
    }, 5000)

    return () => clearTimeout(timer)
  }, [visibleNotification, dismissNotification])

  if (!visibleNotification) return null

  return (
    <div className="fixed right-4 top-16 z-50 w-80">
      <Card className={`border-l-4 ${visibleNotification.type === "fire" ? "border-l-red-500" : "border-l-blue-500"}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {visibleNotification.type === "fire" ? (
                <Flame className="mr-2 h-5 w-5 text-red-500" />
              ) : (
                <Shield className="mr-2 h-5 w-5 text-blue-500" />
              )}
              <div>
                <h4 className="font-medium">{visibleNotification.title}</h4>
                <p className="text-sm text-muted-foreground">{visibleNotification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {visibleNotification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={dismissNotification} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
