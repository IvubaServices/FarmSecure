import { getLiveFeedSettings } from "@/lib/actions/live-feed-actions"
import { LiveFeedSettingsTable } from "@/components/live-feed-settings-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function LiveFeedSettingsPage() {
  let settings = []
  let fetchError = null

  try {
    settings = await getLiveFeedSettings()
    console.log("[Page:LiveFeedSettingsPage] Settings fetched:", settings.length)
  } catch (error) {
    console.error("[Page:LiveFeedSettingsPage] Error fetching settings:", error)
    fetchError = error instanceof Error ? error.message : "An unknown error occurred while fetching settings."
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Live Feed Settings</CardTitle>
          <CardDescription>
            Configure the camera feeds that appear on the live feeds page. Add, edit, or remove feeds as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Data</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          <LiveFeedSettingsTable settings={settings} />
        </CardContent>
      </Card>
    </div>
  )
}
