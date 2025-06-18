"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MapPin } from "lucide-react"
import { MapSelectorModal } from "@/components/map-selector-modal"

export function FixedUpdateForm({ fireZone }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: fireZone.name || "",
    description: fireZone.description || "",
    latitude: fireZone.latitude || "",
    longitude: fireZone.longitude || "",
    severity: fireZone.severity || "Medium",
    status: fireZone.status || "Active",
  })

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (lat, lng) => {
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
      // Convert string coordinates to numbers
      const dataToSubmit = {
        ...formData,
        latitude: Number.parseFloat(formData.latitude),
        longitude: Number.parseFloat(formData.longitude),
        updated_at: new Date().toISOString(),
      }

      console.log("Submitting data:", dataToSubmit)

      // Use direct fetch to the Supabase REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/fire_zones?id=eq.${fireZone.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(dataToSubmit),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Update failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      toast({
        title: "Success",
        description: "Fire zone updated successfully",
      })

      // Force a hard refresh to ensure data is updated
      window.location.href = `/fire-zones/${fireZone.id}`
    } catch (error) {
      console.error("Error updating fire zone:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update fire zone",
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
            onClick={() => {
              // Clear latitude and longitude fields
              setFormData((prev) => ({
                ...prev,
                latitude: "",
                longitude: "",
              }))
              // Open the map modal
              setIsMapModalOpen(true)
            }}
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
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Contained">Contained</SelectItem>
              <SelectItem value="Extinguished">Extinguished</SelectItem>
            </SelectContent>
          </Select>
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
          Update Fire Zone
        </Button>
      </div>
      <MapSelectorModal
        open={isMapModalOpen}
        onOpenChange={setIsMapModalOpen}
        onSelectLocation={handleLocationSelect}
        initialLatitude={formData.latitude ? Number(formData.latitude) : undefined}
        initialLongitude={formData.longitude ? Number(formData.longitude) : undefined}
      />
    </form>
  )
}
