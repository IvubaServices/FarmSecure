"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import the RealtimeStatus component with client-side only rendering
const DynamicRealtimeStatus = dynamic(() => import("@/components/realtime-status").then((mod) => mod.RealtimeStatus), {
  ssr: false,
  loading: () => <div className="h-6 w-24 rounded bg-muted animate-pulse"></div>,
})

export function ClientRealtimeStatus() {
  // Use state to control mounting to ensure it only renders on client
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-6 w-24 rounded bg-muted animate-pulse"></div>
  }

  return <DynamicRealtimeStatus />
}
