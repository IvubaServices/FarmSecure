"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Volume2, Clock, AlertTriangle, Shield, Info } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import type { Notification } from "@/types/notification"

type NotificationPreferences = {
  soundEnabled: boolean
  soundVolume: number
  visualEnabled: boolean
  visualDuration: number
  fireIncidents: boolean
  securityIncidents: boolean
  systemNotifications: boolean
  desktopNotifications: boolean
}

const defaultPreferences: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 70,
  visualEnabled: true,
  visualDuration: 5,
  fireIncidents: true,
  securityIncidents: true,
  systemNotifications: true,
  desktopNotifications: false,
}

interface NotificationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Function to play a notification sound using Web Audio API
const playNotificationSound = (type: "fire" | "security" | "system", volume: number) => {
  try {
    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) {
      console.error("Web Audio API not supported in this browser")
      return
    }

    const audioCtx = new AudioContext()

    // Create oscillator
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    // Set type and frequency based on notification type
    oscillator.type = "sine"

    // Different frequencies for different notification types
    switch (type) {
      case "fire":
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // Higher pitch for urgent notifications
        break
      case "security":
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime) // Medium pitch
        break
      case "system":
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime) // Lower pitch
        break
    }

    // Set volume
    gainNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime)

    // Create envelope
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    // Start and stop
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.5)

    // Clean up
    setTimeout(() => {
      audioCtx.close()
    }, 1000)
  } catch (error) {
    console.error("Error playing notification sound:", error)

    // Fallback to simple beep if Web Audio API fails
    try {
      const snd = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + Array(1000).join("A"),
      )
      snd.volume = volume / 100
      snd.play()
    } catch (fallbackError) {
      console.error("Fallback sound also failed:", fallbackError)
    }
  }
}

export function NotificationSettingsDialog({ open, onOpenChange }: NotificationSettingsDialogProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [selectedSoundType, setSelectedSoundType] = useState<"fire" | "security" | "system">("system")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("notificationPreferences")
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences))
      } catch (e) {
        console.error("Failed to parse saved notification preferences", e)
      }
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences))
  }, [preferences])

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (data && !error) {
        setNotifications(data)
      }
      setLoading(false)
    }

    fetchNotifications()

    // Set up real-time subscription
    const supabase = createClientSupabaseClient()
    const subscription = supabase
      .channel("notifications-dialog-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const updatePreference = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const requestDesktopPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications")
      return
    }

    if (Notification.permission === "granted") {
      updatePreference("desktopNotifications", true)
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      updatePreference("desktopNotifications", permission === "granted")
    }
  }

  const clearHistory = async () => {
    const supabase = createClientSupabaseClient()
    await supabase.from("notifications").delete().neq("id", "placeholder")
    setNotifications([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Customize how you receive notifications about incidents and system events.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sound">Sound</TabsTrigger>
            <TabsTrigger value="types">Notification Types</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="visual-notifications">Visual Notifications</Label>
                <div className="text-sm text-muted-foreground">Show notification popups in the application</div>
              </div>
              <Switch
                id="visual-notifications"
                checked={preferences.visualEnabled}
                onCheckedChange={(checked) => updatePreference("visualEnabled", checked)}
              />
            </div>

            {preferences.visualEnabled && (
              <div className="space-y-2 pl-6 border-l-2 border-muted pt-2">
                <Label htmlFor="visual-duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Display Duration: {preferences.visualDuration} seconds
                </Label>
                <Slider
                  id="visual-duration"
                  min={1}
                  max={15}
                  step={1}
                  value={[preferences.visualDuration]}
                  onValueChange={(value) => updatePreference("visualDuration", value[0])}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Show notifications even when the app is in the background
                </div>
              </div>
              <Switch
                id="desktop-notifications"
                checked={preferences.desktopNotifications}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestDesktopPermission()
                  } else {
                    updatePreference("desktopNotifications", false)
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="sound" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Sound Alerts</Label>
                <div className="text-sm text-muted-foreground">Play sound when new notifications arrive</div>
              </div>
              <Switch
                id="sound-enabled"
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => updatePreference("soundEnabled", checked)}
              />
            </div>

            {preferences.soundEnabled && (
              <div className="space-y-2 pl-6 border-l-2 border-muted pt-2">
                <Label htmlFor="sound-volume" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume: {preferences.soundVolume}%
                </Label>
                <Slider
                  id="sound-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[preferences.soundVolume]}
                  onValueChange={(value) => updatePreference("soundVolume", value[0])}
                />

                <div className="mt-4 space-y-2">
                  <Label>Test Notification Sounds</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedSoundType === "fire" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setSelectedSoundType("fire")}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Fire
                    </Button>
                    <Button
                      variant={selectedSoundType === "security" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setSelectedSoundType("security")}
                    >
                      <Shield className="h-4 w-4" />
                      Security
                    </Button>
                    <Button
                      variant={selectedSoundType === "system" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setSelectedSoundType("system")}
                    >
                      <Info className="h-4 w-4" />
                      System
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => playNotificationSound(selectedSoundType, preferences.soundVolume)}
                  >
                    Play {selectedSoundType.charAt(0).toUpperCase() + selectedSoundType.slice(1)} Sound
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="types" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fire-incidents">Fire Incidents</Label>
                <div className="text-sm text-muted-foreground">Notifications about fire zones and incidents</div>
              </div>
              <Switch
                id="fire-incidents"
                checked={preferences.fireIncidents}
                onCheckedChange={(checked) => updatePreference("fireIncidents", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-incidents">Security Incidents</Label>
                <div className="text-sm text-muted-foreground">Notifications about security points and alerts</div>
              </div>
              <Switch
                id="security-incidents"
                checked={preferences.securityIncidents}
                onCheckedChange={(checked) => updatePreference("securityIncidents", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-notifications">System Notifications</Label>
                <div className="text-sm text-muted-foreground">Notifications about system events and updates</div>
              </div>
              <Switch
                id="system-notifications"
                checked={preferences.systemNotifications}
                onCheckedChange={(checked) => updatePreference("systemNotifications", checked)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setPreferences(defaultPreferences)}>
            Reset to Default
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
