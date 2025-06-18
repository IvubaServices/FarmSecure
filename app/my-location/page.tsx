"use client"

import { useState, useEffect } from "react"
import { useRealtime } from "@/contexts/realtime-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, MapPin, Navigation, User, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationMap } from "@/components/location-map"
import { useSearchParams } from "next/navigation"

export default function MyLocationPage() {
  const { teamMembers, updateTeamMemberLocation, updateTeamMemberStatus } = useRealtime()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Get member ID from URL if present
  const memberIdFromUrl = searchParams.get("member")

  // State for the selected team member (in a real app, this would be the logged-in user)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 })
  const [isOnMap, setIsOnMap] = useState(false)
  const [status, setStatus] = useState("")

  // Set the selected member ID from URL if available
  useEffect(() => {
    if (memberIdFromUrl && !selectedMemberId) {
      const memberId = Number.parseInt(memberIdFromUrl, 10)
      if (!isNaN(memberId)) {
        setSelectedMemberId(memberId)
      }
    }
  }, [memberIdFromUrl, selectedMemberId])

  // Get the selected team member
  const selectedMember = teamMembers.find((member) => member.id === selectedMemberId)

  // Initialize state when a team member is selected
  useEffect(() => {
    if (selectedMember) {
      setCoordinates({
        latitude: selectedMember.latitude || 0,
        longitude: selectedMember.longitude || 0,
      })
      setIsOnMap(selectedMember.is_on_map || false)
      setStatus(selectedMember.status || "")
    }
  }, [selectedMember])

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLocating(false)

        toast({
          title: "Location updated",
          description: "Your current location has been retrieved successfully.",
        })
      },
      (error) => {
        setIsLocating(false)
        toast({
          title: "Error getting location",
          description: error.message,
          variant: "destructive",
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMemberId) {
      toast({
        title: "No team member selected",
        description: "Please select a team member first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await updateTeamMemberLocation(selectedMemberId, coordinates.latitude, coordinates.longitude, isOnMap)

      toast({
        title: "Location updated",
        description: "Your location has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating location:", error)
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedMemberId) return

    try {
      await updateTeamMemberStatus(selectedMemberId, newStatus)
      setStatus(newStatus)
      toast({
        title: "Status updated",
        description: `Your status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">My Location</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Team Member Selection
          </CardTitle>
          <CardDescription>Select your profile to update your location and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamMember">Select Your Profile</Label>
              <Select
                value={selectedMemberId?.toString() || ""}
                onValueChange={(value) => setSelectedMemberId(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your profile" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      selectedMember.status === "Active"
                        ? "success"
                        : selectedMember.status === "On Call"
                          ? "secondary"
                          : selectedMember.status === "On Leave"
                            ? "warning"
                            : "outline"
                    }
                  >
                    {selectedMember.status}
                  </Badge>
                  <Badge
                    variant={
                      selectedMember.team === "Fire"
                        ? "destructive"
                        : selectedMember.team === "Security"
                          ? "default"
                          : "outline"
                    }
                  >
                    {selectedMember.team}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Navigation className="mr-2 h-5 w-5" />
                Update Your Status
              </CardTitle>
              <CardDescription>Set your current availability status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={status === "Active" ? "default" : "outline"}
                  onClick={() => handleStatusChange("Active")}
                  className="flex-1"
                >
                  <Badge variant="success" className="mr-2">
                    Active
                  </Badge>
                  Available for duty
                </Button>
                <Button
                  variant={status === "On Call" ? "default" : "outline"}
                  onClick={() => handleStatusChange("On Call")}
                  className="flex-1"
                >
                  <Badge variant="secondary" className="mr-2">
                    On Call
                  </Badge>
                  Available remotely
                </Button>
                <Button
                  variant={status === "On Leave" ? "default" : "outline"}
                  onClick={() => handleStatusChange("On Leave")}
                  className="flex-1"
                >
                  <Badge variant="warning" className="mr-2">
                    On Leave
                  </Badge>
                  Temporarily unavailable
                </Button>
                <Button
                  variant={status === "Inactive" ? "default" : "outline"}
                  onClick={() => handleStatusChange("Inactive")}
                  className="flex-1"
                >
                  <Badge variant="outline" className="mr-2">
                    Inactive
                  </Badge>
                  Not on duty
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Update Your Location
              </CardTitle>
              <CardDescription>Set your current location to appear on the map</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="auto">
                <TabsList className="mb-4">
                  <TabsTrigger value="auto">Automatic Location</TabsTrigger>
                  <TabsTrigger value="manual">Manual Coordinates</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <Button onClick={getCurrentLocation} disabled={isLocating} className="w-full sm:w-auto">
                      {isLocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLocating ? "Getting Location..." : "Get My Current Location"}
                    </Button>

                    {(coordinates.latitude !== 0 || coordinates.longitude !== 0) && (
                      <div className="p-4 border rounded-md">
                        <p className="font-medium">Current Coordinates:</p>
                        <p className="text-sm text-muted-foreground">
                          Latitude: {coordinates.latitude.toFixed(6)}, Longitude: {coordinates.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={coordinates.latitude || ""}
                        onChange={(e) =>
                          setCoordinates((prev) => ({ ...prev, latitude: Number.parseFloat(e.target.value) }))
                        }
                        placeholder="e.g. -25.7479"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={coordinates.longitude || ""}
                        onChange={(e) =>
                          setCoordinates((prev) => ({ ...prev, longitude: Number.parseFloat(e.target.value) }))
                        }
                        placeholder="e.g. 28.2293"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <LocationMap
                  latitude={coordinates.latitude}
                  longitude={coordinates.longitude}
                  onLocationChange={(lat, lng) => setCoordinates({ latitude: lat, longitude: lng })}
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Switch id="show-on-map" checked={isOnMap} onCheckedChange={setIsOnMap} />
                <Label htmlFor="show-on-map">Show my location on the map</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update My Location
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
}
