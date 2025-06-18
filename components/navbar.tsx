"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MapPin, User, Settings, Map, AlertCircle, Bell, LogOut, Radio, Video } from "lucide-react"
import { ClientRealtimeStatus } from "@/components/client-realtime-status"
import { useState, useEffect } from "react"
import { NotificationSettingsDialog } from "@/components/notification-settings-dialog"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { NotificationItem } from "@/components/notification-item"
import type { Notification } from "@/types/notification"
import { useAuth } from "@/contexts/auth-context"

export function Navbar() {
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { user, logout } = useAuth()
  const [initialFetchTimedOut, setInitialFetchTimedOut] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const supabase = createClientSupabaseClient()

        // Add a timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000))

        const queryPromise = supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any

        if (data && !error) {
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.read).length)
        } else if (error) {
          console.error("Error fetching notifications:", error.message)
          if (error.message === "Request timeout") {
            console.warn("Notification fetch timed out. Consider checking database performance or network latency.")
            setInitialFetchTimedOut(true) // Set the new state here
          }
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (err: any) {
        // Add :any type for err
        console.error("Failed to fetch notifications:", err.message)
        if (err.message === "Request timeout") {
          console.warn(
            "Notification fetch timed out during catch. Consider checking database performance or network latency.",
          )
          setInitialFetchTimedOut(true) // Set the new state here
        }
        setNotifications([])
        setUnreadCount(0)
      }
    }

    fetchNotifications()

    // Set up real-time subscription
    try {
      const supabase = createClientSupabaseClient()
      const subscription = supabase
        .channel("notifications-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
          // Only refetch if the initial fetch was successful (or didn't timeout)
          if (!initialFetchTimedOut && (notifications.length > 0 || unreadCount === 0)) {
            fetchNotifications()
          }
        })
        .subscribe()

      return () => {
        try {
          subscription.unsubscribe()
        } catch (err) {
          console.error("Error unsubscribing from notifications:", err)
        }
      }
    } catch (err) {
      console.error("Failed to set up real-time subscription:", err)
      // Return empty cleanup function
      return () => {}
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.from("notifications").update({ read: true }).eq("id", id)

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleViewAll = () => {
    setIsPopoverOpen(false)
    setNotificationDialogOpen(true)
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex" style={{ perspective: "300px" }}>
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-12 w-12 border-0 animate-spin-y-3d">
              <img
                src="/NewIvubaBird.png"
                alt="Ivuba Command Shield Kingfisher Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">Command Shield Control</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ClientRealtimeStatus />
          <nav className="flex items-center space-x-2">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-2 border-b">
                  <h4 className="font-medium text-sm">Recent Notifications</h4>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => markAsRead(notification.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No notifications</div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full" onClick={handleViewAll}>
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/live-feeds">
                <Video className="h-5 w-5" />
                <span className="sr-only">Live Feeds</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/communication">
                <Radio className="h-5 w-5" />
                <span className="sr-only">Communication</span>
              </Link>
            </Button>
            <NotificationSettingsDialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen} />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/my-location">
                <MapPin className="h-5 w-5" />
                <span className="sr-only">My Location</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/map">
                <Map className="h-5 w-5" />
                <span className="sr-only">Map</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/add-incident">
                <AlertCircle className="h-5 w-5" />
                <span className="sr-only">Report Incident</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/team">
                <User className="h-5 w-5" />
                <span className="sr-only">Team</span>
              </Link>
            </Button>
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
