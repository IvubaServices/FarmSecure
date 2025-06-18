"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check } from "lucide-react"

export function MapConfigSelector() {
  const [mapConfigs, setMapConfigs] = useState([])
  const [selectedConfig, setSelectedConfig] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMapConfigs = async () => {
      setIsLoading(true)
      try {
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase.from("map_config").select("*").order("name")

        if (error) {
          console.error("Error fetching map configs:", error)
          toast({
            title: "Error",
            description: "Failed to load map configurations. Using default settings.",
            variant: "destructive",
          })
          // Set empty array to prevent continuous retries
          setMapConfigs([])
        } else {
          setMapConfigs(data || [])

          // Find the active config
          const activeConfig = data?.find((config) => config.is_active)
          if (activeConfig) {
            setSelectedConfig(activeConfig.id)
          }
        }
      } catch (err) {
        console.error("Error in fetchMapConfigs:", err)
        toast({
          title: "Error",
          description: "Failed to load map configurations. Using default settings.",
          variant: "destructive",
        })
        // Set empty array to prevent continuous retries
        setMapConfigs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMapConfigs()
  }, [toast])

  const handleConfigChange = (value) => {
    setSelectedConfig(value)
  }

  const handleApplyConfig = async () => {
    if (!selectedConfig) return

    setIsSaving(true)
    const supabase = createClientSupabaseClient()

    try {
      // First, set all configs to inactive
      await supabase.from("map_config").update({ is_active: false }).neq("id", "placeholder")

      // Then set the selected config to active
      const { error } = await supabase.from("map_config").update({ is_active: true }).eq("id", selectedConfig)

      if (error) throw error

      toast({
        title: "Map configuration updated",
        description: "The map view has been updated successfully",
      })

      // Refresh the page to apply the new config
      router.refresh()
    } catch (error) {
      console.error("Error updating map config:", error)
      toast({
        title: "Error",
        description: "Failed to update map configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading map views...</span>
        </div>
      ) : mapConfigs.length > 0 ? (
        <>
          <Select value={selectedConfig} onValueChange={handleConfigChange} disabled={isLoading}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select map view" />
            </SelectTrigger>
            <SelectContent>
              {mapConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center">
                    {config.is_active && <Check className="mr-2 h-4 w-4 text-green-500" />}
                    {config.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleApplyConfig} disabled={isLoading || isSaving || !selectedConfig}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply
          </Button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">No map configurations available. Using default view.</div>
      )}
    </div>
  )
}
