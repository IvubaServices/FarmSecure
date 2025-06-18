export type NotificationType = "fire" | "security" | "system"
export type NotificationSeverity = "critical" | "high" | "medium" | "low"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  severity: NotificationSeverity
  created_at: string
  read: boolean
  user_id?: string
  metadata?: Record<string, any>
}
