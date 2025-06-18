import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Shield, Info, Bell } from "lucide-react"

interface NotificationHistoryItemProps {
  notification: {
    id: string
    type: "fire" | "security" | "system"
    title: string
    message: string
    timestamp: number
    severity?: "low" | "medium" | "high" | "critical"
  }
}

export function NotificationHistoryItem({ notification }: NotificationHistoryItemProps) {
  const { type, title, message, timestamp, severity } = notification

  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case "fire":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "security":
        return <Shield className="h-5 w-5 text-blue-500" />
      case "system":
        return <Info className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Get background color based on severity
  const getBgColor = () => {
    if (!severity) return "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"

    switch (severity) {
      case "critical":
        return "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
      case "high":
        return "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
      case "medium":
        return "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
      case "low":
        return "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
      default:
        return "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
    }
  }

  return (
    <div className={`p-3 rounded-md mb-2 transition-colors ${getBgColor()}`}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm">{title}</h4>
            <span className="text-xs text-muted-foreground ml-2">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  )
}
