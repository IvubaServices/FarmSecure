"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, Calendar, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import type { Notification, NotificationSeverity, NotificationType } from "@/types/notification"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const [fireNotifications, setFireNotifications] = useState(true)
  const [securityNotifications, setSecurityNotifications] = useState(true)
  const [systemNotifications, setSystemNotifications] = useState(true)
  const [teamNotifications, setTeamNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [soundAlerts, setSoundAlerts] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [quietHours, setQuietHours] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch notifications with filters
  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") params.append("type", activeTab)
      if (severityFilter !== "all") params.append("severity", severityFilter)
      if (timeFilter !== "all") params.append("timeFrame", timeFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      setNotifications(data.notifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchNotifications()

    // Subscribe to changes in the notifications table
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab, timeFilter, severityFilter, searchQuery])

  // Clear all notifications
  const clearAllNotifications = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "All notifications cleared",
      })
      setNotifications([])
    } catch (error) {
      console.error("Error clearing notifications:", error)
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Clear notifications by type
  const clearNotificationType = async (type: NotificationType) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/notifications?type=${type}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications cleared`,
      })
      fetchNotifications()
    } catch (error) {
      console.error("Error clearing notifications:", error)
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string, read: boolean) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, read }),
      })
      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read } : notification)),
      )
    } catch (error) {
      console.error("Error updating notification:", error)
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      })
    }
  }

  // Export notifications as CSV
  const exportNotifications = () => {
    if (notifications.length === 0) {
      toast({
        title: "No data",
        description: "There are no notifications to export",
      })
      return
    }

    // Create CSV content
    const headers = ["Type", "Title", "Message", "Severity", "Date", "Read"]
    const csvContent = [
      headers.join(","),
      ...notifications.map((notification) => {
        return [
          notification.type,
          `"${notification.title.replace(/"/g, '""')}"`,
          `"${notification.message.replace(/"/g, '""')}"`,
          notification.severity,
          new Date(notification.created_at).toLocaleString(),
          notification.read ? "Yes" : "No",
        ].join(",")
      }),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `notifications-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60 * 1000) {
      return "Just now"
    } else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    } else if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    } else {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days} day${days !== 1 ? "s" : ""} ago`
    }
  }

  const getSeverityColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "fire":
        return <Bell className="h-5 w-5 text-red-500" />
      case "security":
        return <Bell className="h-5 w-5 text-blue-500" />
      case "system":
        return <Bell className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  // Calculate notification statistics
  const totalNotifications = notifications.length
  const criticalNotifications = notifications.filter((n) => n.severity === "critical").length
  const unreadNotifications = notifications.filter((n) => !n.read).length
  const responseRate = totalNotifications > 0 ? Math.round((unreadNotifications / totalNotifications) * 100) : 0

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would save these preferences to Supabase
      // For now, we'll just simulate a delay and show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for persistence between sessions
      localStorage.setItem(
        "notificationPreferences",
        JSON.stringify({
          fireNotifications,
          securityNotifications,
          systemNotifications,
          teamNotifications,
          inAppNotifications,
          soundAlerts,
          desktopNotifications,
          emailNotifications,
          quietHours,
        }),
      )

      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem("notificationPreferences")
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        setFireNotifications(preferences.fireNotifications ?? true)
        setSecurityNotifications(preferences.securityNotifications ?? true)
        setSystemNotifications(preferences.systemNotifications ?? true)
        setTeamNotifications(preferences.teamNotifications ?? true)
        setInAppNotifications(preferences.inAppNotifications ?? true)
        setSoundAlerts(preferences.soundAlerts ?? true)
        setDesktopNotifications(preferences.desktopNotifications ?? false)
        setEmailNotifications(preferences.emailNotifications ?? false)
        setQuietHours(preferences.quietHours ?? false)
      } catch (error) {
        console.error("Error parsing saved preferences:", error)
      }
    }
  }, [])

  // Delete individual notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Notification deleted",
      })

      // Remove from local state
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  function renderNotificationList(notifications: Notification[]) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
          <h3 className="text-lg font-medium">Loading notifications...</h3>
        </div>
      )
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No notifications found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery || activeTab !== "all" || timeFilter !== "all" || severityFilter !== "all"
              ? "Try adjusting your filters"
              : "You're all caught up!"}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors ${
              !notification.read ? "bg-muted/30" : ""
            }`}
          >
            <div className="flex-shrink-0">{getTypeIcon(notification.type as NotificationType)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{notification.title}</h4>
                <Badge
                  variant="outline"
                  className={`${getSeverityColor(notification.severity as NotificationSeverity)} text-white`}
                >
                  {notification.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatTimestamp(notification.created_at)}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id, !notification.read)}>
                    {notification.read ? "Mark as unread" : "Mark as read"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Manage your notification preferences and history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportNotifications} disabled={notifications.length === 0}>
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={clearAllNotifications}
            disabled={isDeleting || notifications.length === 0}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalNotifications}</p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalNotifications}</p>
            </div>
            <Bell className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold text-blue-600">{unreadNotifications}</p>
            </div>
            <Bell className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold text-green-600">{100 - responseRate}%</p>
            </div>
            <Bell className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Button variant={activeTab === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("all")}>
              All
            </Button>
            <Button
              variant={activeTab === "fire" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("fire")}
            >
              Fire
            </Button>
            <Button
              variant={activeTab === "security" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("security")}
            >
              Security
            </Button>
            <Button
              variant={activeTab === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("system")}
            >
              System
            </Button>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm flex-1 min-w-[200px]"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-card text-card-foreground rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Notification History</h2>
          <p className="text-sm text-muted-foreground">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="p-4">{renderNotificationList(notifications)}</div>
      </div>
    </div>
  )
}
