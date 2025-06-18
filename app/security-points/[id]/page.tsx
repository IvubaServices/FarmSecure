"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SecurityPointForm } from "@/components/security-point-form"
import { Shield, ArrowLeft, MapPin, MessageSquare } from "lucide-react"
import { MapViewButton } from "@/components/map-view-button"
import { useRouter } from "next/navigation"

function getStatusBadge(status) {
  const variants = {
    Alert: "destructive",
    Active: "success",
    Inactive: "outline",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

function getTypeBadge(type) {
  const variants = {
    Checkpoint: "default",
    Camera: "secondary",
    Sensor: "outline",
    Guard: "default",
  }

  return <Badge variant={variants[type] || "outline"}>{type}</Badge>
}

export default function SecurityPointDetailPage({ params }) {
  const router = useRouter()

  const [securityPoint, setSecurityPoint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Handle the "add" route - redirect to the proper add page
  useEffect(() => {
    if (params.id === "add") {
      router.replace("/security-points/add")
    }
  }, [params.id, router])

  // If this is the "add" route, show loading while redirecting
  if (params.id === "add") {
    return <div className="container mx-auto p-4">Redirecting to add page...</div>
  }

  useEffect(() => {
    async function loadSecurityPoint() {
      try {
        setLoading(true)
        // Add a timestamp to prevent caching issues
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/security-points/${params.id}?t=${timestamp}`, {
          // Add cache control headers
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch security point: ${response.status}`)
        }

        const data = await response.json()
        setSecurityPoint(data)
        setError(null)
      } catch (err) {
        console.error("Error loading security point:", err)
        setError(err.message || "Failed to load security point")
      } finally {
        setLoading(false)
      }
    }

    loadSecurityPoint()
  }, [params.id])

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error || !securityPoint) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || "Security point not found"}</span>
        </div>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/security-points">Back to Security Points</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/security-points">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{securityPoint.name}</h1>
        {getStatusBadge(securityPoint.status)}
        {getTypeBadge(securityPoint.type)}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-500" />
              Security Point Details
            </CardTitle>
            <CardDescription>Information about this security point</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{securityPoint.description || "No description provided"}</p>
            </div>

            <div>
              <h3 className="font-medium">Location</h3>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="whitespace-nowrap">
                  {securityPoint.latitude.toFixed(6)}, {securityPoint.longitude.toFixed(6)}
                </span>
                <MapViewButton
                  latitude={securityPoint.latitude}
                  longitude={securityPoint.longitude}
                  name={securityPoint.name}
                  description={securityPoint.description}
                  status={securityPoint.status}
                  type="security"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Status</h3>
                <p>{getStatusBadge(securityPoint.status)}</p>
              </div>
              <div>
                <h3 className="font-medium">Type</h3>
                <p>{getTypeBadge(securityPoint.type)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Created</h3>
                <p className="text-muted-foreground">{new Date(securityPoint.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-medium">Last Updated</h3>
                <p className="text-muted-foreground">{new Date(securityPoint.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
              onClick={() => {
                // Construct message with security point details
                const mapLink = `https://www.google.com/maps?q=${securityPoint.latitude.toFixed(6)},${securityPoint.longitude.toFixed(6)}`
                const message = encodeURIComponent(
                  `🛡️ ALERT: Security incident at ${securityPoint.name}
Type: ${securityPoint.type}
Status: ${securityPoint.status}
Location: ${securityPoint.latitude.toFixed(6)}, ${securityPoint.longitude.toFixed(6)}
Description: ${securityPoint.description || "No description"}
Map: ${mapLink}

Please respond if you are nearby and available.`,
                )
                // Open WhatsApp group chat with the message
                window.open(`https://wa.me/?text=${message}`, "_blank")
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Alert Security Team
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Security Point</CardTitle>
            <CardDescription>Update the details of this security point</CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityPointForm
              initialData={{
                id: securityPoint.id,
                name: securityPoint.name,
                latitude: securityPoint.latitude,
                longitude: securityPoint.longitude,
                status: securityPoint.status,
                type: securityPoint.type,
                description: securityPoint.description,
              }}
              onSuccess={() => {
                // Force refresh the page data after successful update
                router.refresh()
                // Also refetch the data directly
                fetch(`/api/security-points/${params.id}`)
                  .then((response) => {
                    if (response.ok) return response.json()
                    throw new Error("Failed to refresh data")
                  })
                  .then((data) => setSecurityPoint(data))
                  .catch((err) => console.error("Error refreshing data:", err))
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
