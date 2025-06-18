"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

// Define types for our data
type FireZone = {
  id: string
  name: string
  latitude: number
  longitude: number
  severity: string
  status: string
  description?: string
  reported_at: string
  updated_at: string
}

type SecurityPoint = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  type: string
  description?: string
  created_at: string
  updated_at: string
}

type TeamMember = {
  id: number
  name: string
  role: string
  email: string
  phone: string
  avatar: string | null
  status: string
  responsibility: string | null
  team: string
  latitude?: number
  longitude?: number
  is_on_map?: boolean
  created_at?: string
  updated_at?: string
}

type RealtimeContextType = {
  fireZones: FireZone[]
  securityPoints: SecurityPoint[]
  teamMembers: TeamMember[]
  isLoading: boolean
  isConnected: boolean
  lastUpdated: Date | null
  error: string | null
  refreshData: () => Promise<void>
  updateTeamMemberStatus: (id: number, status: string) => Promise<void>
  updateTeamMemberLocation: (id: number, latitude: number, longitude: number, isOnMap: boolean) => Promise<void>
  getSubscriptionStatus: (tableName: string) => { isConnected: boolean; error: Error | null; retryCount: number } | null
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

const MAX_SUBSCRIPTION_RETRIES = 3

// 1. Update props to accept initial data from the server
type RealtimeProviderProps = {
  children: ReactNode
  initialFireZones: FireZone[]
  initialSecurityPoints: SecurityPoint[]
  initialTeamMembers: TeamMember[]
}

export function RealtimeProvider({
  children,
  initialFireZones,
  initialSecurityPoints,
  initialTeamMembers,
}: RealtimeProviderProps) {
  // 2. Initialize state with server-fetched data
  const [fireZones, setFireZones] = useState<FireZone[]>(initialFireZones)
  const [securityPoints, setSecurityPoints] = useState<SecurityPoint[]>(initialSecurityPoints)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers)
  const [isLoading, setIsLoading] = useState(false) // Data is already loaded, so no initial loading state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date()) // Set initial timestamp
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { toast } = useToast()

  // This function is now only for manual refreshes, not initial load
  const refreshData = useCallback(async () => {
    console.log("[RealtimeProvider] Manually refreshing data...")
    setIsLoading(true)
    setFetchError(null)
    try {
      const supabase = createClientSupabaseClient()
      const fzRes = await supabase.from("fire_zones").select("*").order("reported_at", { ascending: false })
      if (fzRes.error) throw new Error(`Fetch fire_zones: ${fzRes.error.message}`)
      setFireZones(fzRes.data || [])

      const spRes = await supabase.from("security_points").select("*").order("created_at", { ascending: false })
      if (spRes.error) throw new Error(`Fetch security_points: ${spRes.error.message}`)
      setSecurityPoints(spRes.data || [])

      const tmRes = await supabase.from("team_members").select("*").order("name", { ascending: true })
      if (tmRes.error) throw new Error(`Fetch team_members: ${tmRes.error.message}`)
      setTeamMembers(tmRes.data || [])

      setLastUpdated(new Date())
      toast({ title: "Success", description: "Data has been refreshed." })
    } catch (err: any) {
      console.error(`[RealtimeProvider] Error during manual refresh: ${err.message}`, err)
      setFetchError(err.message)
      toast({ title: "Data Refresh Error", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 3. The useEffect for initial fetching is no longer needed and has been removed.

  // ... (updateTeamMemberStatus, updateTeamMemberLocation, and change handlers remain the same)
  const updateTeamMemberStatus = useCallback(
    async (id: number, status: string) => {
      try {
        const supabase = createClientSupabaseClient()
        const { error: updateError } = await supabase
          .from("team_members")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)
        if (updateError) throw updateError
      } catch (error: any) {
        console.error("Error updating team member status:", error)
        toast({
          title: "Error",
          description: `Failed to update team member status: ${error.message}`,
          variant: "destructive",
        })
      }
    },
    [toast],
  )
  const updateTeamMemberLocation = useCallback(
    async (id: number, latitude: number, longitude: number, isOnMap: boolean) => {
      try {
        const supabase = createClientSupabaseClient()
        const { error: updateError } = await supabase
          .from("team_members")
          .update({
            latitude,
            longitude,
            is_on_map: isOnMap,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
        if (updateError) throw updateError
      } catch (error: any) {
        console.error("Error updating team member location:", error)
        toast({
          title: "Error",
          description: `Failed to update team member location: ${error.message}`,
          variant: "destructive",
        })
      }
    },
    [toast],
  )
  const handleFireZoneChange = useCallback(
    (payload: any) => {
      console.log("[RealtimeProvider] Fire zone change received:", payload)
      setLastUpdated(new Date())
      if (payload.eventType === "INSERT") {
        setFireZones((prev) => (prev.some((zone) => zone.id === payload.new.id) ? prev : [payload.new, ...prev]))
        toast({ title: "New Fire Zone", description: `${payload.new.name} has been added` })
      } else if (payload.eventType === "UPDATE") {
        setFireZones((prev) => prev.map((zone) => (zone.id === payload.new.id ? payload.new : zone)))
        toast({ title: "Fire Zone Updated", description: `${payload.new.name} has been updated` })
      } else if (payload.eventType === "DELETE" && payload.old) {
        setFireZones((prev) => prev.filter((zone) => zone.id !== payload.old?.id))
        toast({ title: "Fire Zone Removed", description: `A fire zone has been removed` })
      }
    },
    [toast],
  )
  const handleSecurityPointChange = useCallback(
    (payload: any) => {
      setLastUpdated(new Date())
      if (payload.eventType === "INSERT") {
        setSecurityPoints((prev) => (prev.some((point) => point.id === payload.new.id) ? prev : [payload.new, ...prev]))
        toast({ title: "New Security Point", description: `${payload.new.name} has been added` })
      } else if (payload.eventType === "UPDATE") {
        setSecurityPoints((prev) => prev.map((point) => (point.id === payload.new.id ? payload.new : point)))
        toast({ title: "Security Point Updated", description: `${payload.new.name} has been updated` })
      } else if (payload.eventType === "DELETE" && payload.old) {
        setSecurityPoints((prev) => prev.filter((point) => point.id !== payload.old?.id))
        toast({ title: "Security Point Removed", description: `A security point has been removed` })
      }
    },
    [toast],
  )
  const handleTeamMemberChange = useCallback(
    (payload: any) => {
      setLastUpdated(new Date())
      if (payload.eventType === "INSERT") {
        setTeamMembers((prev) =>
          prev.some((member) => member.id === payload.new.id)
            ? prev
            : [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name)),
        )
        toast({ title: "New Team Member", description: `${payload.new.name} has been added` })
      } else if (payload.eventType === "UPDATE") {
        setTeamMembers((prev) => prev.map((member) => (member.id === payload.new.id ? payload.new : member)))
      } else if (payload.eventType === "DELETE" && payload.old) {
        setTeamMembers((prev) => prev.filter((member) => member.id !== payload.old?.id))
        toast({ title: "Team Member Removed", description: `A team member has been removed` })
      }
    },
    [toast],
  )

  const fzSub = useRealtimeSubscription<FireZone>("fire_zones", handleFireZoneChange)
  const spSub = useRealtimeSubscription<SecurityPoint>("security_points", handleSecurityPointChange)
  const tmSub = useRealtimeSubscription<TeamMember>("team_members", handleTeamMemberChange)

  useEffect(() => {
    if (fzSub.error) console.error("[RealtimeProvider] Fire zones subscription error state:", fzSub.error.message)
    if (fzSub.retryCount >= MAX_SUBSCRIPTION_RETRIES && !fzSub.isConnected && fzSub.error) {
      toast({
        title: "Realtime Issue: Fire Zones",
        description: `Persistent connection problem with 'fire_zones' updates. Last error: ${fzSub.error.message}.`,
        variant: "warning",
        duration: 20000,
      })
    }
  }, [fzSub.isConnected, fzSub.error, fzSub.retryCount, toast])

  useEffect(() => {
    if (spSub.error) console.error("[RealtimeProvider] Security points subscription error state:", spSub.error.message)
    if (spSub.retryCount >= MAX_SUBSCRIPTION_RETRIES && !spSub.isConnected && spSub.error) {
      toast({
        title: "Realtime Issue: Security Points",
        description: `Persistent connection problem with 'security_points' updates. Last error: ${spSub.error.message}.`,
        variant: "warning",
        duration: 20000,
      })
    }
  }, [spSub.isConnected, spSub.error, spSub.retryCount, toast])

  useEffect(() => {
    if (tmSub.error) console.error("[RealtimeProvider] Team members subscription error state:", tmSub.error.message)
    if (tmSub.retryCount >= MAX_SUBSCRIPTION_RETRIES && !tmSub.isConnected && tmSub.error) {
      toast({
        title: "Realtime Issue: Team Members",
        description: `Persistent connection problem with 'team_members' updates. Last error: ${tmSub.error.message}.`,
        variant: "warning",
        duration: 20000,
      })
    }
  }, [tmSub.isConnected, tmSub.error, tmSub.retryCount, toast])

  const isConnected = fzSub.isConnected && spSub.isConnected && tmSub.isConnected

  const getSubscriptionStatus = useCallback(
    (tableName: string) => {
      if (tableName === "fire_zones") return fzSub
      if (tableName === "security_points") return spSub
      if (tableName === "team_members") return tmSub
      return null
    },
    [fzSub, spSub, tmSub],
  )

  return (
    <RealtimeContext.Provider
      value={{
        fireZones,
        securityPoints,
        teamMembers,
        isLoading,
        isConnected,
        lastUpdated,
        error: fetchError,
        refreshData,
        updateTeamMemberStatus,
        updateTeamMemberLocation,
        getSubscriptionStatus,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}
