"use client"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, ArrowLeft, MapPin, MessageSquare } from "lucide-react"
import { FixedUpdateForm } from "@/components/fixed-update-form"
import { MapViewButton } from "@/components/map-view-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Move the server-side functions outside the component
async function getFireZoneData(id) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("fire_zones").select("*").eq("id", id).single()

  if (error || !data) {
    return null
  }

  return data
}

function getSeverityBadge(severity) {
  const variants = {
    Critical: "destructive",
    High: "destructive",
    Medium: "warning",
    Low: "outline",
  }

  return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>
}

function getStatusBadge(status) {
  const variants = {
    Active: "destructive",
    Contained: "warning",
    Extinguished: "outline",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

// Create a new client component
export default function FireZoneDetailPage({ params }) {
  const [fireZone, setFireZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Special case: if the ID is "add", redirect to the add page
    if (params.id === "add") {
      router.push("/fire-zones/add")
      return
    }

    async function loadFireZone() {
      try {
        // Use a client-side fetch instead of direct server component data fetching
        const response = await fetch(`/api/fire-zones/${params.id}`)

        if (response.status === 404) {
          setError("Fire zone not found")
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch fire zone")
        }

        const data = await response.json()
        setFireZone(data)
      } catch (error) {
        console.error("Error loading fire zone:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadFireZone()
  }, [params.id, router])

  if (params.id === "add") {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error || !fireZone) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/fire-zones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>Error: {error || "Fire zone not found"}</p>
            <Button className="mt-4" asChild>
              <Link href="/fire-zones">Return to Fire Zones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/fire-zones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{fireZone.name}</h1>
        {getSeverityBadge(fireZone.severity)}
        {getStatusBadge(fireZone.status)}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="mr-2 h-5 w-5 text-red-500" />
              Fire Zone Details
            </CardTitle>
            <CardDescription>Information about this fire incident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{fireZone.description || "No description provided"}</p>
            </div>

            <div>
              <h3 className="font-medium">Location</h3>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="whitespace-nowrap">
                  {fireZone.latitude.toFixed(6)}, {fireZone.longitude.toFixed(6)}
                </span>
                <MapViewButton
                  latitude={fireZone.latitude}
                  longitude={fireZone.longitude}
                  name={fireZone.name}
                  description={fireZone.description}
                  status={fireZone.status}
                  severity={fireZone.severity}
                  reportedAt={fireZone.reported_at}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Severity</h3>
                <p>{getSeverityBadge(fireZone.severity)}</p>
              </div>
              <div>
                <h3 className="font-medium">Status</h3>
                <p>{getStatusBadge(fireZone.status)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Reported</h3>
                <p className="text-muted-foreground">{new Date(fireZone.reported_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-medium">Last Updated</h3>
                <p className="text-muted-foreground">{new Date(fireZone.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                // Construct message with fire zone details
                const mapLink = `https://www.google.com/maps?q=${fireZone.latitude.toFixed(6)},${fireZone.longitude.toFixed(6)}`
                const message = encodeURIComponent(
                  `🔥 ALERT: Fire incident at ${fireZone.name}
Severity: ${fireZone.severity}
Status: ${fireZone.status}
Location: ${fireZone.latitude.toFixed(6)}, ${fireZone.longitude.toFixed(6)}
Description: ${fireZone.description || "No description"}
Map: ${mapLink}

Please respond if you are nearby and available.`,
                )
                // Open WhatsApp group chat with the message
                window.open(`https://wa.me/?text=${message}`, "_blank")
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Alert Nearby Fire Team
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Fire Zone</CardTitle>
            <CardDescription>Update the details of this fire incident</CardDescription>
          </CardHeader>
          <CardContent>
            <FixedUpdateForm fireZone={fireZone} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
