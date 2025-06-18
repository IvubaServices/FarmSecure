"use client"

import { useRealtime } from "@/contexts/realtime-context"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function RealtimeStatus() {
  const { isConnected, lastUpdated, refreshData } = useRealtime()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(60)
  const [autoRefresh, setAutoRefresh] = useState(() => {
    // Get saved preference from localStorage, default to false
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("autoRefresh")
      return saved !== null ? saved === "true" : false
    }
    return false
  })

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    if (typeof window !== "undefined") {
      window.location.reload()
    }
    // This line might not be reached due to page reload
    setIsRefreshing(false)
  }

  const toggleAutoRefresh = (checked: boolean) => {
    setAutoRefresh(checked)
    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("autoRefresh", checked.toString())
    }

    // Reset timers when toggling
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    // If enabling auto-refresh, start timers immediately
    if (checked) {
      setNextRefresh(60)
      startTimers()
    }
  }

  const startTimers = () => {
    // Set up automatic refresh every minute
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    refreshTimerRef.current = setTimeout(async () => {
      if (autoRefresh) {
        setIsRefreshing(true)
        await refreshData()
        setIsRefreshing(false)
        setNextRefresh(60)
        startTimers()
      }
    }, 60000)

    // Set up countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }

    setNextRefresh(60)
    countdownTimerRef.current = setInterval(() => {
      setNextRefresh((prev) => {
        if (prev <= 1) {
          return 60
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    // Only start timers if auto-refresh is enabled
    if (autoRefresh) {
      startTimers()
    }

    // Clean up timers on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [autoRefresh, refreshData])

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isConnected ? "outline" : "destructive"}
              className={`flex items-center gap-1 ${isConnected ? "bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900" : ""}`}
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-xs">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="text-xs">Offline</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected ? "Real-time updates are active" : "Real-time updates are not available"}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-2">
        {!autoRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Reload page"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Reload page data</span>
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Refresh settings">
              <Clock className="h-4 w-4" />
              <span className="sr-only">Refresh settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex flex-col gap-4">
              <h4 className="font-medium leading-none">Refresh Settings</h4>
              <div className="flex items-center justify-between space-y-0">
                <div className="flex flex-col">
                  <Label htmlFor="auto-refresh" className="mb-1">
                    Auto Refresh
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {autoRefresh ? "Data refreshes automatically every minute" : "Manual refresh only"}
                  </span>
                </div>
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={toggleAutoRefresh} />
              </div>

              {autoRefresh && (
                <div className="text-sm text-muted-foreground">Next refresh in: {nextRefresh} seconds</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
