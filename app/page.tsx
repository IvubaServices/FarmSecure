"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flame, AlertTriangle, MapPin, Zap, Clock } from "lucide-react"
import { DashboardMap } from "@/components/dashboard-map"
import { MapConfigSelector } from "@/components/map-config-selector"
import { Loading } from "@/components/loading"
import { useRealtime } from "@/contexts/realtime-context"
import { WeatherWidget } from "@/components/weather-widget"
import { WeatherDetail } from "@/components/weather-detail"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/auth/protected-route"

function Dashboard() {
  // Dashboard component code remains the same
  const { fireZones, securityPoints, isLoading } = useRealtime()
  const [loadsheddingStatus, setLoadsheddingStatus] = useState({ stage: "Unknown", name: "Loading..." })
  const [nextSchedule, setNextSchedule] = useState({
    stage: "Unknown",
    startTime: "",
    endTime: "",
    name: "Loading next schedule...",
  })
  const [isLoadingLoadshedding, setIsLoadingLoadshedding] = useState(true)

  // Rest of the dashboard component code...
  // (Keeping all the existing functionality)

  // Fetch loadshedding status from Supabase
  useEffect(() => {
    async function fetchLoadsheddingData() {
      try {
        setIsLoadingLoadshedding(true)
        const supabase = createClientSupabaseClient()

        // Get the latest map_config entries (top 5) to find current and next schedules
        const { data, error } = await supabase
          .from("map_config")
          .select("name, created_at")
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          console.error("Error fetching loadshedding data:", error)
          setLoadsheddingStatus({
            stage: "Unknown",
            name: "Error loading data",
          })
          setNextSchedule({
            stage: "Unknown",
            startTime: "",
            endTime: "",
            name: "Error loading next schedule",
          })
        } else if (data && data.length > 0) {
          // Process data for current status
          let currentFound = false
          let nextFound = false

          // Look for entries that contain current and next schedule information
          for (const entry of data) {
            const nameValue = entry.name || ""

            // Check if this entry is about current status
            if (!currentFound && nameValue.toLowerCase().includes("current")) {
              const stageMatch = nameValue.match(/Stage\s*(\d+)/i)
              setLoadsheddingStatus({
                stage: stageMatch ? stageMatch[1] : "Unknown",
                name: nameValue,
              })
              currentFound = true
            }

            // Check if this entry is about next schedule
            else if (
              !nextFound &&
              (nameValue.toLowerCase().includes("next") || nameValue.toLowerCase().includes("upcoming"))
            ) {
              const stageMatch = nameValue.match(/Stage\s*(\d+)/i)
              const timeMatch = nameValue.match(/(\d{1,2}:\d{2})\s*(?:to|until|-)?\s*(\d{1,2}:\d{2})?/i)

              setNextSchedule({
                stage: stageMatch ? stageMatch[1] : "Unknown",
                startTime: timeMatch && timeMatch[1] ? timeMatch[1] : "",
                endTime: timeMatch && timeMatch[2] ? timeMatch[2] : "",
                name: nameValue,
              })
              nextFound = true
            }

            // If we found both, we can stop processing
            if (currentFound && nextFound) break
          }

          // If we didn't find specific entries, use the first entry for current status
          if (!currentFound && data.length > 0) {
            const nameValue = data[0].name || ""
            const stageMatch = nameValue.match(/Stage\s*(\d+)/i)
            setLoadsheddingStatus({
              stage: stageMatch ? stageMatch[1] : "Unknown",
              name: nameValue,
            })
          }

          // If we didn't find a next schedule, set default values
          if (!nextFound) {
            setNextSchedule({
              stage: "Unknown",
              startTime: "",
              endTime: "",
              name: "No upcoming schedule found",
            })
          }
        } else {
          setLoadsheddingStatus({
            stage: "Unknown",
            name: "No data available",
          })
          setNextSchedule({
            stage: "Unknown",
            startTime: "",
            endTime: "",
            name: "No upcoming schedule available",
          })
        }
      } catch (err) {
        console.error("Failed to fetch loadshedding data:", err)
        setLoadsheddingStatus({
          stage: "Unknown",
          name: "Error loading data",
        })
        setNextSchedule({
          stage: "Unknown",
          startTime: "",
          endTime: "",
          name: "Error loading next schedule",
        })
      } finally {
        setIsLoadingLoadshedding(false)
      }
    }

    fetchLoadsheddingData()

    // Set up real-time subscription for loadshedding updates
    const supabase = createClientSupabaseClient()
    const subscription = supabase
      .channel("map_config_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_config",
        },
        () => {
          fetchLoadsheddingData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Memoize filtered data to prevent unnecessary recalculations
  const activeFireZones = useMemo(() => {
    return fireZones.filter((zone) => zone.status === "Active").slice(0, 5)
  }, [fireZones])

  const alertSecurityPoints = useMemo(() => {
    return securityPoints.filter((point) => point.status === "Alert").slice(0, 5)
  }, [securityPoints])

  // Memoize stats to prevent unnecessary recalculations
  const stats = useMemo(
    () => ({
      fireZonesCount: fireZones.length,
      securityPointsCount: securityPoints.length,
      activeFireZones,
      alertSecurityPoints,
    }),
    [fireZones.length, securityPoints.length, activeFireZones, alertSecurityPoints],
  )

  if (isLoading) {
    return <Loading message="Loading dashboard data..." />
  }

  // Determine the color based on the stage
  const getStageColor = (stage) => {
    if (stage === "Unknown") return "bg-green-500" // No loadshedding: Green
    const stageNum = Number.parseInt(stage)
    if (isNaN(stageNum)) return "bg-gray-500" // Error state: Gray
    if (stageNum <= 2) return "bg-amber-500" // Stage 1-2: Amber
    if (stageNum <= 4) return "bg-red-500" // Stage 3-4: Red
    return "bg-purple-500" // Stage 5+: Purple
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <MapConfigSelector />
      </div>

      {/* Rest of the dashboard UI remains the same */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        {/* Total Fire Zones */}
        <Card className="bg-background/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Fire Zones</p>
              <div className="text-3xl font-bold">{stats.fireZonesCount}</div>
              <p className="text-xs text-muted-foreground">{activeFireZones.length} active incidents</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Security Points */}
        <Card className="bg-background/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Security Points</p>
              <div className="text-3xl font-bold">{stats.securityPointsCount}</div>
              <p className="text-xs text-muted-foreground">{alertSecurityPoints.length} in alert status</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Fires */}
        <Card className="bg-background/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Fires</p>
              <div className="text-3xl font-bold">{activeFireZones.length}</div>
              <p className="text-xs text-muted-foreground">{stats.fireZonesCount - activeFireZones.length} contained</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card className="bg-background/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Security Status</p>
              <div className="text-3xl font-bold text-green-500">
                {stats.securityPointsCount - alertSecurityPoints.length} OK
              </div>
              <p className="text-xs text-muted-foreground">{alertSecurityPoints.length} points need attention</p>
            </div>
          </CardContent>
        </Card>

        {/* Weather Widget */}
        <WeatherWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="mr-2 h-5 w-5 text-red-500" />
              Active Fire Zones
            </CardTitle>
            <CardDescription>Currently active fire incidents</CardDescription>
          </CardHeader>
          <CardContent>
            {activeFireZones.length > 0 ? (
              <ul className="space-y-2">
                {activeFireZones.map((zone) => (
                  <li key={zone.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">Severity: {zone.severity}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/fire-zones/${zone.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No active fire zones</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/fire-zones">View All Fire Zones</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Security Alerts
            </CardTitle>
            <CardDescription>Security points in alert status</CardDescription>
          </CardHeader>
          <CardContent>
            {alertSecurityPoints.length > 0 ? (
              <ul className="space-y-2">
                {alertSecurityPoints.map((point) => (
                  <li key={point.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{point.name}</p>
                      <p className="text-sm text-muted-foreground">Type: {point.type}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/security-points/${point.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No security alerts</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/security-points">View All Security Points</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Weather Detail Card */}
      <WeatherDetail />

      {/* Loadshedding Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Loadshedding Status
          </CardTitle>
          <CardDescription>Current and upcoming loadshedding schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Status */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Current Status</h3>
              {isLoadingLoadshedding ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-300 animate-pulse"></div>
                  <span className="font-bold">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className={`h-4 w-4 rounded-full ${getStageColor(loadsheddingStatus.stage)}`}></div>
                    <span className="font-bold">
                      {loadsheddingStatus.stage !== "Unknown" ? `Stage ${loadsheddingStatus.stage}` : "No Loadshedding"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {loadsheddingStatus.stage !== "Unknown" ? loadsheddingStatus.name : "Power is currently available"}
                  </p>
                </>
              )}
            </div>

            {/* Next Schedule */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Next Schedule</h3>
              {isLoadingLoadshedding ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-300 animate-pulse"></div>
                  <span className="font-bold">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className={`h-4 w-4 rounded-full ${getStageColor(nextSchedule.stage)}`}></div>
                    <span className="font-bold">
                      {nextSchedule.stage !== "Unknown" ? `Stage ${nextSchedule.stage}` : "No Scheduled Outages"}
                    </span>
                  </div>
                  {nextSchedule.startTime && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Starting at {nextSchedule.startTime}
                      {nextSchedule.startTime.toLowerCase().includes("tomorrow") ? "" : " today"}
                    </p>
                  )}
                  {nextSchedule.endTime && (
                    <p className="text-sm text-muted-foreground">
                      Until {nextSchedule.endTime}
                      {nextSchedule.endTime.toLowerCase().includes("tomorrow") ? "" : " today"}
                    </p>
                  )}
                  {nextSchedule.stage === "Unknown" && (
                    <p className="text-sm text-muted-foreground mt-2">No upcoming loadshedding scheduled</p>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-start">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            Last updated: {isLoadingLoadshedding ? "Loading..." : "Just now"}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Farm Overview Map
          </CardTitle>
          <CardDescription>Interactive map of all fire zones and security points</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full">{isLoading ? <Loading message="Loading map..." /> : <DashboardMap />}</div>
        </CardContent>
        <CardFooter>
          <Button asChild className="mt-5">
            <Link href="/map">Open Full Map</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Wrap the Dashboard component with authentication protection
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
