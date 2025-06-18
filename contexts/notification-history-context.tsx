"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type NotificationType = "fire" | "security" | "system"
export type NotificationSeverity = "low" | "medium" | "high" | "critical"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  severity?: NotificationSeverity
}

interface NotificationHistoryContextType {
  history: Notification[]
  addToHistory: (notification: Omit<Notification, "id" | "timestamp">) => void
  clearHistory: () => void
  clearNotificationType: (type: NotificationType) => void
}

const NotificationHistoryContext = createContext<NotificationHistoryContextType | undefined>(undefined)

export function NotificationHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Notification[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("notificationHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to parse saved notification history", e)
      }
    }
  }, [])

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("notificationHistory", JSON.stringify(history))
  }, [history])

  const addToHistory = (notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    }

    setHistory((prev) => {
      // Limit history to 50 items
      const updatedHistory = [newNotification, ...prev].slice(0, 50)
      return updatedHistory
    })
  }

  const clearHistory = () => {
    setHistory([])
  }

  const clearNotificationType = (type: NotificationType) => {
    setHistory((prev) => prev.filter((notification) => notification.type !== type))
  }

  return (
    <NotificationHistoryContext.Provider value={{ history, addToHistory, clearHistory, clearNotificationType }}>
      {children}
    </NotificationHistoryContext.Provider>
  )
}

export function useNotificationHistory() {
  const context = useContext(NotificationHistoryContext)
  if (!context) {
    throw new Error("useNotificationHistory must be used within a NotificationHistoryProvider")
  }
  return context
}
