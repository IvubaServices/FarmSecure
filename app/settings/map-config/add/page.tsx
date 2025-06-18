import { MapConfigForm } from "@/components/map-config-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export default function AddMapConfigPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add Map Configuration</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            New Map Configuration
          </CardTitle>
          <CardDescription>Define a new map view for the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <MapConfigForm />
        </CardContent>
      </Card>
    </div>
  )
}
