import { FireZoneForm } from "@/components/fire-zone-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

export default function AddFireZonePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add Fire Zone</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="mr-2 h-5 w-5 text-red-500" />
            New Fire Incident
          </CardTitle>
          <CardDescription>Report a new fire incident on the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <FireZoneForm />
        </CardContent>
      </Card>
    </div>
  )
}
