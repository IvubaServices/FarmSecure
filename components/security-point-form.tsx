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
import { MapPin } from "lucide-react"
import { MapSelectorModal } from "@/components/map-selector-modal"

export function SecurityPointForm({ initialData = null, onSuccess = () => {} }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(null)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    status: initialData?.status || "Active",
    type: initialData?.type || "Checkpoint",
    description: initialData?.description || "",
  })

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  useEffect(() => {
    fetchSecurityTeamMembers()
  }, [])

  useEffect(() => {
    // When team members are loaded, find the selected member
    if (teamMembers.length > 0 && formData.assigned_to) {
      const member = teamMembers.find((m) => m.id === formData.assigned_to)
      setSelectedTeamMember(member)
    }
  }, [teamMembers, formData.assigned_to])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    if (name === "assigned_to") {
      const member = teamMembers.find((m) => m.id === value)
      setSelectedTeamMember(member)
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }))
    setIsMapModalOpen(false)
  }

  const fetchSecurityTeamMembers = async () => {
    setLoadingTeamMembers(true)
    try {
      const supabase = createClientSupabaseClient()

      // First, let's try to get all team members to see what's in the table
      const { data: allMembers, error: allError } = await supabase.from("team_members").select("*").limit(5)

      console.log("All team members sample:", allMembers)
      console.log("All members error:", allError)

      // Now try different variations of the security team query
      const queries = [{ team: "security" }, { team: "Security" }, { team: "SECURITY" }]

      let securityMembers = []

      for (const query of queries) {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, name, email, team, status")
          .eq("team", query.team)

        console.log(`Query with team="${query.team}":`, data, error)

        if (data && data.length > 0) {
          securityMembers = data
          break
        }
      }

      // If still no results, try without team filter
      if (securityMembers.length === 0) {
        const { data, error } = await supabase.from("team_members").select("id, name, email, team, status")

        console.log("All team members:", data)
        securityMembers = data || []
      }

      setTeamMembers(securityMembers)
    } catch (error) {
      console.error("Error fetching security team members:", error)
      setTeamMembers([])
    } finally {
      setLoadingTeamMembers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      // Convert string coordinates to numbers and remove assigned_to if it's not in the schema
      const dataToSubmit = {
        name: formData.name,
        latitude: Number.parseFloat(formData.latitude),
        longitude: Number.parseFloat(formData.longitude),
        status: formData.status,
        type: formData.type,
        description: formData.description,
        // assigned_to is removed since it's not in the schema
      }

      let response

      if (initialData) {
        // Update existing record
        response = await supabase.from("security_points").update(dataToSubmit).eq("id", initialData.id)
      } else {
        // Insert new record
        response = await supabase.from("security_points").insert(dataToSubmit)
      }

      if (response.error) throw response.error

      // If we have an assigned team member, create a separate record in a different table
      /*if (formData.assigned_to) {
        try {
          const securityPointId = response.data?.[0]?.id || initialData?.id

          if (securityPointId) {
            // Check if assignment already exists
            const { data: existingAssignment } = await supabase
              .from("security_point_assignments")
              .select("*")
              .eq("security_point_id", securityPointId)
              .single()

            if (existingAssignment) {
              // Update existing assignment
              await supabase
                .from("security_point_assignments")
                .update({ team_member_id: formData.assigned_to })
                .eq("id", existingAssignment.id)
            } else {
              // Create new assignment
              await supabase.from("security_point_assignments").insert({
                security_point_id: securityPointId,
                team_member_id: formData.assigned_to,
                assigned_at: new Date().toISOString(),
              })
            }
          }
        } catch (assignmentError) {
          console.error("Error saving team member assignment:", assignmentError)
          // Don't fail the whole operation if this part fails
        }
      }*/

      toast({
        title: initialData ? "Security point updated" : "Security point added",
        description: `Successfully ${initialData ? "updated" : "added"} security point "${formData.name}"`,
      })

      // Create a notification for the new security point
      try {
        await supabase.from("notifications").insert({
          type: "security",
          title: `New Security Point Added: ${formData.name}`,
          message: formData.description || `A new ${formData.type} security point has been added.`,
          severity: formData.status === "Alert" ? "high" : "medium",
          read: false,
          metadata: {
            securityPointId: response.data?.[0]?.id,
            type: formData.type,
            location: {
              latitude: formData.latitude,
              longitude: formData.longitude,
            },
          },
        })
      } catch (error) {
        console.error("Error creating notification:", error)
      }

      onSuccess()

      // Use window.location for a full page navigation instead of router
      window.location.href = "/security-points"
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
          <Label htmlFor="name">Security Point Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter security point name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
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

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <div className="flex space-x-2">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <div className="flex space-x-2">
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
        </div>

        <div className="col-span-1 md:col-span-2 mt-2">
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
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Alert">Alert</SelectItem>
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
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update" : "Add"} Security Point
        </Button>
      </div>
      <MapSelectorModal
        open={isMapModalOpen}
        onOpenChange={setIsMapModalOpen}
        onSelectLocation={handleLocationSelect}
        initialLatitude={formData.latitude ? Number.parseFloat(formData.latitude) : undefined}
        initialLongitude={formData.longitude ? Number.parseFloat(formData.longitude) : undefined}
      />
    </form>
  )
}
