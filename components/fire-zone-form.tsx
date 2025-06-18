"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function FireZoneForm({ initialData = null }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    severity: initialData?.severity || "Medium",
    status: initialData?.status || "Active",
    description: initialData?.description || "",
  })

  // Ensure we have the latest data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        latitude: initialData.latitude || "",
        longitude: initialData.longitude || "",
        severity: initialData.severity || "Medium",
        status: initialData.status || "Active",
        description: initialData.description || "",
      })
      console.log("Form initialized with data:", initialData)
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      }

      console.log("Submitting data:", dataToSubmit)

      // Use the server-side Supabase client directly
      const supabase = createClientSupabaseClient()

      if (initialData) {
        console.log("Updating fire zone with ID:", initialData.id)

        // Direct fetch to Supabase REST API to bypass client limitations
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/fire_zones?id=eq.${initialData.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify(dataToSubmit),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to update: ${response.statusText}`)
        }

        console.log("Update successful")
      } else {
        // Insert new record
        const { data, error } = await supabase.from("fire_zones").insert(dataToSubmit).select()
        if (error) throw error

        // Create a notification for the new fire zone
        try {
          await supabase.from("notifications").insert({
            type: "fire",
            title: `New Fire Zone Reported: ${formData.name}`,
            message: formData.description || `A new fire zone with ${formData.severity} severity has been reported.`,
            severity: formData.severity.toLowerCase(),
            read: false,
            metadata: {
              fireZoneId: data?.[0]?.id,
              status: formData.status,
              location: {
                latitude: formData.latitude,
                longitude: formData.longitude,
              },
            },
          })
        } catch (error) {
          console.error("Error creating notification:", error)
        }
      }

      toast({
        title: initialData ? "Fire zone updated" : "Fire zone added",
        description: `Successfully ${initialData ? "updated" : "added"} fire zone "${formData.name}"`,
      })

      // Force a hard refresh to ensure data is updated
      window.location.href = "/fire-zones"
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
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
          {initialData ? "Update" : "Add"} Fire Zone
        </Button>
      </div>
    </form>
  )
}
