"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, MapPin, Bell, Shield, Video } from "lucide-react"
import { useRouter } from "next/navigation"

const settingsCategories = [
  {
    title: "Map Configuration",
    description: "Manage map settings and view configurations",
    icon: MapPin,
    href: "/settings/map-config",
    disabled: false,
  },
  {
    title: "Notification Settings",
    description: "Configure alert and notification preferences",
    icon: Bell,
    href: "/settings/notifications",
    disabled: false,
  },
  {
    title: "Live Feed Settings",
    description: "Manage live camera feed URLs and titles",
    icon: Video,
    href: "/settings/live-feeds",
    disabled: false,
  },
  {
    title: "Security Settings",
    description: "Configure security policies and access controls",
    icon: Shield,
    href: "/settings/security",
    disabled: true,
  },
]

export default function SettingsPage() {
  const router = useRouter()

  // Reorder categories to place "Live Feed Settings" after "Notification Settings"
  const orderedSettingsCategories = [
    settingsCategories.find((cat) => cat.title === "Map Configuration")!,
    settingsCategories.find((cat) => cat.title === "Notification Settings")!,
    settingsCategories.find((cat) => cat.title === "Live Feed Settings")!,
    settingsCategories.find((cat) => cat.title === "Security Settings")!,
  ].filter(Boolean) // Filter out undefined in case a title is mistyped or removed

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Configure application settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orderedSettingsCategories.map((category) => (
              <Card
                key={category.title}
                className={`overflow-hidden ${category.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <category.icon className="mr-2 h-5 w-5" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    {category.description}
                    {category.disabled && <span className="text-red-500 ml-1">(Coming soon)</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => !category.disabled && router.push(category.href)}
                    disabled={category.disabled}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
