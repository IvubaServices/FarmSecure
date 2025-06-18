"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MapPin } from "lucide-react"
import { MapSelectorModal } from "@/components/map-selector-modal"

export function MapConfigForm({ initialData = null }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    centerLatitude: initialData?.centerLatitude || "",
    centerLongitude: initialData?.centerLongitude || "",
    defaultZoom: initialData?.defaultZoom || 10,
    minZoom: initialData?.minZoom || 3,
    maxZoom: initialData?.maxZoom || 18,
    boundsNorth: initialData?.boundsNorth || "",
    boundsSouth: initialData?.boundsSouth || "",
    boundsEast: initialData?.boundsEast || "",
    boundsWest: initialData?.boundsWest || "",
    isActive: initialData?.isActive ?? true,
  })

  // State for map selector modal
  const [isMapOpen, setIsMapOpen] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  // Handle location selection from map
  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      centerLatitude: lat.toString(),
      centerLongitude: lng.toString(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        id: initialData?.id,
      }

      console.log("Submitting map config data via API:", apiData)

      // Use the appropriate HTTP method based on whether we're updating or creating
      const method = initialData ? "PUT" : "POST"
      const response = await fetch("/api/map-config", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save map configuration")
      }

      console.log("API response:", result)

      toast({
        title: initialData ? "Map configuration updated" : "Map configuration added",
        description: `Successfully ${initialData ? "updated" : "added"} map configuration "${formData.name}"`,
      })

      // Use router.refresh() to refresh the page data
      router.refresh()

      // Navigate back to the map config list
      router.push("/settings/map-config")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save map configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="isActive">Active Status</Label>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isActive" className="cursor-pointer">
              {formData.isActive ? "Active" : "Inactive"}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="centerLatitude">Center Latitude</Label>
          <Input
            id="centerLatitude"
            name="centerLatitude"
            type="number"
            step="any"
            value={formData.centerLatitude}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="centerLongitude">Center Longitude</Label>
          <Input
            id="centerLongitude"
            name="centerLongitude"
            type="number"
            step="any"
            value={formData.centerLongitude}
            onChange={handleChange}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                centerLatitude: "",
                centerLongitude: "",
              }))
              setIsMapOpen(true)
            }}
            className="w-full flex items-center justify-center"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Select Center Location on Map
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultZoom">Default Zoom Level</Label>
          <Input
            id="defaultZoom"
            name="defaultZoom"
            type="number"
            min="1"
            max="20"
            value={formData.defaultZoom}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="minZoom">Min Zoom</Label>
            <Input
              id="minZoom"
              name="minZoom"
              type="number"
              min="1"
              max="20"
              value={formData.minZoom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxZoom">Max Zoom</Label>
            <Input
              id="maxZoom"
              name="maxZoom"
              type="number"
              min="1"
              max="20"
              value={formData.maxZoom}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Map Boundaries (Optional)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="boundsNorth">North Boundary</Label>
            <Input
              id="boundsNorth"
              name="boundsNorth"
              type="number"
              step="any"
              value={formData.boundsNorth}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boundsSouth">South Boundary</Label>
            <Input
              id="boundsSouth"
              name="boundsSouth"
              type="number"
              step="any"
              value={formData.boundsSouth}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boundsEast">East Boundary</Label>
            <Input
              id="boundsEast"
              name="boundsEast"
              type="number"
              step="any"
              value={formData.boundsEast}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boundsWest">West Boundary</Label>
            <Input
              id="boundsWest"
              name="boundsWest"
              type="number"
              step="any"
              value={formData.boundsWest}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? initialData
              ? "Updating..."
              : "Creating..."
            : (initialData ? "Update" : "Add") + " Map Configuration"}
        </Button>
      </div>

      {/* Map Selector Modal */}
      <MapSelectorModal
        open={isMapOpen}
        onOpenChange={setIsMapOpen}
        onSelectLocation={handleLocationSelect}
        initialLatitude={formData.centerLatitude ? Number(formData.centerLatitude) : undefined}
        initialLongitude={formData.centerLongitude ? Number(formData.centerLongitude) : undefined}
      />
    </form>
  )
}
