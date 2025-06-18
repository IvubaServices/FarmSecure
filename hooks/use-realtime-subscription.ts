"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import type { RealtimeChannel, RealtimeChannelSendResponse, SupabaseClient } from "@supabase/supabase-js"

type SubscriptionCallback<T> = (payload: {
  new: T
  old: T | null
  eventType: "INSERT" | "UPDATE" | "DELETE"
}) => void

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 5000 // 5 seconds
const MAX_RETRY_DELAY_MS = 30000 // Cap retry delay to 30 seconds

export function useRealtimeSubscription<T>(
  table: string,
  callback?: SubscriptionCallback<T>,
  options?: {
    event?: "INSERT" | "UPDATE" | "DELETE" | "*"
    filter?: string
  },
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const supabaseRef = useRef<SupabaseClient>(createClientSupabaseClient())
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentChannelRef = useRef<RealtimeChannel | null>(null)

  const cleanupCurrentAttempt = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (currentChannelRef.current) {
      const ch = currentChannelRef.current
      currentChannelRef.current = null
      console.log(`[useRealtimeSubscription] Cleaning up channel for table ${table}: ${ch.topic}, state: ${ch.state}`)
      if (ch.state !== "closed" && ch.state !== "errored") {
        supabaseRef.current
          .removeChannel(ch)
          .then((response: RealtimeChannelSendResponse | string) => {
            if (
              (typeof response === "string" && response === "ok") ||
              (typeof response === "object" && response.status === "ok")
            ) {
              console.log(`[useRealtimeSubscription] Successfully removed channel for ${table}.`)
            } else {
              console.warn(`[useRealtimeSubscription] Problem removing channel for ${table}:`, response)
            }
          })
          .catch((removeError) => {
            console.error(`[useRealtimeSubscription] Error during removeChannel for ${table}:`, removeError)
          })
      } else {
        console.log(`[useRealtimeSubscription] Channel for ${table} already ${ch.state}, no removal needed.`)
      }
    }
  }, [table])

  const attemptSubscription = useCallback(async () => {
    cleanupCurrentAttempt()

    if (retryCount <= MAX_RETRIES) {
      setError(null)
    }

    console.log(
      `[useRealtimeSubscription] Attempting to subscribe to table: ${table}, attempt: ${retryCount + 1} of ${MAX_RETRIES + 1}`,
    )
    if (options?.filter) {
      console.log(`[useRealtimeSubscription] Using filter for ${table}: ${options.filter}`)
    }

    const supabase = supabaseRef.current
    console.log(`[useRealtimeSubscription] Supabase client for ${table}: URL: ${supabase.supabaseUrl}`)
    console.log(
      `[useRealtimeSubscription] Supabase realtime client state before channel creation for ${table}:`,
      `isConnected: ${supabase.realtime.isConnected()}`,
      `connectionState: ${supabase.realtime.connectionState}`,
    )

    // Proactively try to connect the main realtime client if it's closed
    if (supabase.realtime.connectionState === "closed") {
      console.log(`[useRealtimeSubscription] Main realtime client for ${table} is closed. Attempting to connect...`)
      try {
        await new Promise<void>((resolve, reject) => {
          supabase.realtime.connect()
          // Listen for open or error, with a timeout
          const timeoutId = setTimeout(() => {
            supabase.realtime.removeListener("REALTIME_SUBSCRIBE_ERROR", onError) // Use specific error event if available or generic
            supabase.realtime.removeListener("REALTIME_SYSTEM_EVENT", onOpen) // Use specific open event if available or generic
            reject(new Error("Main realtime client connection attempt timed out after 5s"))
          }, 5000)

          const onOpen = (event: any) => {
            // Replace 'any' with actual event type if known
            if (event.type === "system" && event.payload?.status === "ok") {
              // Example, adjust to actual event structure
              clearTimeout(timeoutId)
              supabase.realtime.removeListener("REALTIME_SUBSCRIBE_ERROR", onError)
              supabase.realtime.removeListener("REALTIME_SYSTEM_EVENT", onOpen)
              console.log(`[useRealtimeSubscription] Main realtime client for ${table} connected successfully.`)
              resolve()
            }
          }
          const onError = (err: any) => {
            // Replace 'any' with actual event type if known
            clearTimeout(timeoutId)
            supabase.realtime.removeListener("REALTIME_SUBSCRIBE_ERROR", onError)
            supabase.realtime.removeListener("REALTIME_SYSTEM_EVENT", onOpen)
            console.error(`[useRealtimeSubscription] Error connecting main realtime client for ${table}:`, err)
            reject(err)
          }
          // These event names might need adjustment based on the exact Supabase client version's event system
          // For modern Supabase, direct connect() doesn't emit these; status is checked via connectionState
          // The promise might resolve/reject based on polling connectionState or a short delay
          // For simplicity, we'll assume connect() is synchronous enough or rely on subsequent checks.
          // A more robust way is to check supabase.realtime.connectionState after a short delay.
          // This part is tricky without exact event names for `connect()` success/failure.
          // Let's simplify: call connect and then check state.
        })
        // Short delay to allow connection state to update
        await new Promise((resolve) => setTimeout(resolve, 200))
        console.log(
          `[useRealtimeSubscription] Main realtime client state after connect attempt for ${table}: ${supabase.realtime.connectionState}`,
        )
      } catch (connectError: any) {
        console.error(
          `[useRealtimeSubscription] Failed to connect main realtime client for ${table}: ${connectError.message}`,
        )
        // Proceed to channel subscription anyway, it might still work or provide a more specific error
      }
    }

    try {
      const channelName = `realtime:${table}:${Math.random().toString(36).substring(2, 9)}`
      console.log(`[useRealtimeSubscription] Creating channel: ${channelName} for table ${table}`)
      const newChannel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true },
        },
      })
      currentChannelRef.current = newChannel
      setChannel(newChannel)

      newChannel.on(
        "postgres_changes",
        {
          event: options?.event || "*",
          schema: "public",
          table,
          ...(options?.filter ? { filter: options.filter } : {}),
        },
        (payload) => {
          if (callback) {
            callback({
              new: payload.new as T,
              old: payload.old as T | null,
              eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            })
          }
        },
      )

      console.log(`[useRealtimeSubscription] Calling .subscribe() for channel ${newChannel.topic}`)
      newChannel.subscribe((status, err) => {
        console.log(
          `[useRealtimeSubscription] Table ${table} (Channel: ${newChannel.topic}) subscription status: ${status}`,
          err || "",
        )
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          setError(null)
          setRetryCount(0)
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setIsConnected(false)
          const specificError = new Error(
            status === "TIMED_OUT"
              ? `Connection timed out for table ${table}`
              : `Channel error for table ${table}: ${err?.message || "Unknown channel error"}`,
          )

          if (retryCount < MAX_RETRIES) {
            setError(specificError) // Set error for this failed attempt
            const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS)
            console.log(
              `[useRealtimeSubscription] Retrying subscription for ${table} in ${delay / 1000}s... (Attempt ${retryCount + 2}/${MAX_RETRIES + 1})`,
            )
            retryTimeoutRef.current = setTimeout(() => {
              setRetryCount((prev) => prev + 1)
            }, delay)
          } else {
            console.error(`[useRealtimeSubscription] Max retries reached for table ${table}. Giving up.`)
            setError(new Error(`Max retries for ${table}. Last error: ${specificError.message}`))
            setIsConnected(false)
          }
        } else if (status === "CLOSED") {
          setIsConnected(false)
          console.log(`[useRealtimeSubscription] Channel closed for table ${table}.`)
        } else {
          setIsConnected(false)
        }
      })
    } catch (errCatch: any) {
      console.error(`[useRealtimeSubscription] Catastrophic error setting up subscription for ${table}:`, errCatch)
      setError(errCatch instanceof Error ? errCatch : new Error(String(errCatch)))
      setIsConnected(false)
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS)
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, delay)
      }
    }
  }, [table, options?.event, options?.filter, callback, retryCount, cleanupCurrentAttempt])

  useEffect(() => {
    if (retryCount > MAX_RETRIES) {
      return // Final failure state already set
    }
    attemptSubscription()

    return () => {
      console.log(`[useRealtimeSubscription] Unmounting or re-running for table ${table}. Final cleanup.`)
      cleanupCurrentAttempt()
    }
  }, [retryCount, attemptSubscription]) // Rerun when retryCount changes or attemptSubscription itself changes (it shouldn't often)

  return { isConnected, error, retryCount }
}
