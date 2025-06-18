"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle, MapPin } from "lucide-react"
import { MapSelectorModal } from "@/components/map-selector-modal"

export default function AddIncidentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [incidentType, setIncidentType] = useState("fire")
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    description: "",
    severity: "Medium",
    status: "Active",
    type: "Checkpoint",
  })

  const [isMapOpen, setIsMapOpen] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      // Convert string coordinates to numbers
      const dataToSubmit = {
        ...formData,
        latitude: Number.parseFloat(formData.latitude),
        longitude: Number.parseFloat(formData.longitude),
      }

      let response

      if (incidentType === "fire") {
        response = await supabase.from("fire_zones").insert({
          name: dataToSubmit.name,
          latitude: dataToSubmit.latitude,
          longitude: dataToSubmit.longitude,
          description: dataToSubmit.description,
          severity: dataToSubmit.severity,
          status: dataToSubmit.status,
        })
      } else {
        response = await supabase.from("security_points").insert({
          name: dataToSubmit.name,
          latitude: dataToSubmit.latitude,
          longitude: dataToSubmit.longitude,
          description: dataToSubmit.description,
          status: dataToSubmit.status,
          type: dataToSubmit.type,
        })
      }

      if (response.error) throw response.error

      toast({
        title: "Incident reported",
        description: `Successfully reported ${incidentType === "fire" ? "fire incident" : "security issue"}: "${
          formData.name
        }"`,
      })

      // Create a notification for the new incident
      const notificationType = incidentType === "fire" ? "fire" : "security"
      const notificationSeverity =
        incidentType === "fire"
          ? dataToSubmit.severity.toLowerCase()
          : dataToSubmit.status === "Alert"
            ? "high"
            : "medium"

      await supabase.from("notifications").insert({
        type: notificationType,
        title: `New ${incidentType === "fire" ? "Fire" : "Security"} Incident Reported`,
        message: `${dataToSubmit.name} - ${dataToSubmit.description.substring(0, 100)}${dataToSubmit.description.length > 100 ? "..." : ""}`,
        severity: notificationSeverity,
        read: false,
        metadata: {
          incidentId: response.data?.[0]?.id,
          incidentType: incidentType,
          location: {
            latitude: dataToSubmit.latitude,
            longitude: dataToSubmit.longitude,
          },
        },
      })

      router.push(incidentType === "fire" ? "/fire-zones" : "/security-points")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit incident report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Report Incident</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            New Incident Report
          </CardTitle>
          <CardDescription>Report a new fire or security incident on the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Incident Type</Label>
                <RadioGroup
                  defaultValue="fire"
                  value={incidentType}
                  onValueChange={setIncidentType}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fire" id="fire" />
                    <Label htmlFor="fire" className="cursor-pointer">
                      Fire Incident
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="security" id="security" />
                    <Label htmlFor="security" className="cursor-pointer">
                      Security Issue
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Incident Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                {incidentType === "fire" ? (
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={formData.severity} onValueChange={(value) => handleSelectChange("severity", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="type">Security Point Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checkpoint">Checkpoint</SelectItem>
                        <SelectItem value="Camera">Camera</SelectItem>
                        <SelectItem value="Sensor">Sensor</SelectItem>
                        <SelectItem value="Guard">Guard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMapOpen(true)}
                    className="w-full flex items-center justify-center"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Select Location on Map
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentType === "fire" ? (
                        <>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Contained">Contained</SelectItem>
                          <SelectItem value="Extinguished">Extinguished</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Alert">Alert</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Report {incidentType === "fire" ? "Fire Incident" : "Security Issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <MapSelectorModal
        open={isMapOpen}
        onOpenChange={setIsMapOpen}
        onSelectLocation={handleLocationSelect}
        initialLatitude={formData.latitude ? Number(formData.latitude) : undefined}
        initialLongitude={formData.longitude ? Number(formData.longitude) : undefined}
      />
    </div>
  )
}
