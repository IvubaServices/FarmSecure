"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateFireZone } from "@/lib/actions"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  latitude: z.string().refine(
    (value) => {
      try {
        const num = Number.parseFloat(value)
        return !isNaN(num) && num >= -90 && num <= 90
      } catch (e) {
        return false
      }
    },
    {
      message: "Latitude must be a valid number between -90 and 90.",
    },
  ),
  longitude: z.string().refine(
    (value) => {
      try {
        const num = Number.parseFloat(value)
        return !isNaN(num) && num >= -180 && num <= 180
      } catch (e) {
        return false
      }
    },
    {
      message: "Longitude must be a valid number between -180 and 180.",
    },
  ),
  severity: z.string().min(1, {
    message: "Please select a severity.",
  }),
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
})

interface FireZone {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  severity: string
  status: string
}

interface UpdateFireZoneFormProps {
  fireZone: FireZone
}

export function UpdateFireZoneForm({ fireZone }: UpdateFireZoneFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: fireZone.name,
      description: fireZone.description,
      latitude: fireZone.latitude.toString(),
      longitude: fireZone.longitude.toString(),
      severity: fireZone.severity,
      status: fireZone.status,
    },
  })

  const [formState, setFormState] = useState({
    name: fireZone.name,
    description: fireZone.description,
    latitude: fireZone.latitude.toString(),
    longitude: fireZone.longitude.toString(),
    severity: fireZone.severity,
    status: fireZone.status,
  })

  useEffect(() => {
    setFormState({
      name: fireZone.name,
      description: fireZone.description,
      latitude: fireZone.latitude.toString(),
      longitude: fireZone.longitude.toString(),
      severity: fireZone.severity,
      status: fireZone.status,
    })
  }, [fireZone])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState({ ...formState, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create FormData object for server action
      const formData = new FormData()
      formData.append("id", fireZone.id)
      formData.append("name", formState.name)
      formData.append("description", formState.description)
      formData.append("latitude", formState.latitude.toString())
      formData.append("longitude", formState.longitude.toString())
      formData.append("severity", formState.severity)
      formData.append("status", formState.status)

      // Try the server action first
      let result
      try {
        result = await updateFireZone(formData)
      } catch (serverActionError) {
        console.error("Server action failed, trying API route:", serverActionError)

        // If server action fails, try the API route as fallback
        const response = await fetch(`/api/fire-zones/${fireZone.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formState.name,
            description: formState.description,
            latitude: Number(formState.latitude),
            longitude: Number(formState.longitude),
            severity: formState.severity,
            status: formState.status,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "API update failed")
        }

        result = await response.json()
      }

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Fire zone updated successfully",
        })

        // Force a hard refresh to ensure data is updated
        window.location.href = `/fire-zones/${fireZone.id}`
      } else {
        throw new Error(result.message || result.error || "Update failed")
      }
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
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Fire Zone Name"
                  {...field}
                  value={formState.name}
                  onChange={(e) => {
                    field.onChange(e)
                    handleInputChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description of the fire zone"
                  className="resize-none"
                  {...field}
                  value={formState.description}
                  onChange={(e) => {
                    field.onChange(e)
                    handleInputChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Latitude"
                    {...field}
                    value={formState.latitude}
                    onChange={(e) => {
                      field.onChange(e)
                      handleInputChange(e)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Longitude"
                    {...field}
                    value={formState.longitude}
                    onChange={(e) => {
                      field.onChange(e)
                      handleInputChange(e)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-row gap-4">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Severity</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleSelectChange("severity", value)
                  }}
                  defaultValue={formState.severity}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleSelectChange("status", value)
                  }}
                  defaultValue={formState.status}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="contained">Contained</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={isLoading} type="submit">
          {isLoading && (
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          Update Fire Zone
        </Button>
      </form>
    </Form>
  )
}
