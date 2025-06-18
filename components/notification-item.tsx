"use client"

import { formatDistanceToNow } from "date-fns"
import { AlertCircle, Bell, Shield } from "lucide-react"
import type { Notification } from "@/types/notification"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "fire":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "security":
        return <Shield className="h-5 w-5 text-amber-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = () => {
    switch (notification.severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-amber-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0",
        !notification.read && "bg-muted/30",
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{notification.title}</p>
          <div className={`h-2 w-2 rounded-full ${getSeverityColor()}`} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
