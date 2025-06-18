"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

// Define props for the map content component
interface MapSelectorProps {
  onSelectLocation: (lat: number, lng: number) => void
  initialLatitude?: number
  initialLongitude?: number
}

// Create a wrapper component that will dynamically import the map content
export function MapSelectorModal({
  open,
  onOpenChange,
  onSelectLocation,
  initialLatitude,
  initialLongitude,
}: MapSelectorProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Dynamically import the map content component to avoid SSR issues
  const DynamicMapSelector = dynamic(() => import("./map-selector-content"), {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  })

  useEffect(() => {
    // Cleanup function when modal closes
    return () => {
      // Any cleanup needed after closing the modal
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Select Map Center Location
          </DialogTitle>
          <DialogDescription>
            Click on the map to select the center location for your map configuration. The coordinates will be
            automatically filled in the form.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
          <DynamicMapSelector
            onSelectLocation={onSelectLocation}
            initialLatitude={initialLatitude}
            initialLongitude={initialLongitude}
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              // Ensure the modal closes properly
              onOpenChange(false)
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
