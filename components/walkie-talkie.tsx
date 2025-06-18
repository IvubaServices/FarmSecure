"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Radio, Volume2, VolumeX, AlertCircle, Users, Wifi, WifiOff } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Default channels if database isn't available
const DEFAULT_CHANNELS = [
  { id: "general", name: "General", description: "Main communication channel" },
  { id: "security", name: "Security", description: "Security team channel" },
  { id: "emergency", name: "Emergency", description: "Emergency response channel" },
  { id: "maintenance", name: "Maintenance", description: "Maintenance team channel" },
]

export function WalkieTalkie() {
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [channels, setChannels] = useState(DEFAULT_CHANNELS)
  const [currentChannel, setCurrentChannel] = useState(DEFAULT_CHANNELS[0].id)
  const [activeUsers, setActiveUsers] = useState([])
  const [channelUsers, setChannelUsers] = useState([])
  const [currentUser, setCurrentUser] = useState({
    id: "user-" + Math.random().toString(36).substr(2, 9),
    name: "User " + Math.floor(Math.random() * 1000),
  })
  const [isOnline, setIsOnline] = useState(true)
  const [micPermission, setMicPermission] = useState(null)
  const [audioContext, setAudioContext] = useState(null)
  const [mediaStream, setMediaStream] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [lastProcessedId, setLastProcessedId] = useState("")
  const [realtimeChannel, setRealtimeChannel] = useState(null)
  const [isConnectedToRealtime, setIsConnectedToRealtime] = useState(false)

  const transmitTimer = useRef(null)
  const mediaRecorder = useRef(null)
  const presenceTimer = useRef(null)
  const supabaseClient = useRef(null)
  const { toast } = useToast()

  // Initialize Supabase client
  useEffect(() => {
    supabaseClient.current = createClientSupabaseClient()
  }, [])

  // Initialize audio context and get microphone permission
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        setMediaStream(stream)
        setMicPermission(true)

        const context = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContext(context)

        toast({
          title: "Microphone Ready",
          description: "Audio communication is now available",
          duration: 2000,
        })
      } catch (error) {
        console.error("Error accessing microphone:", error)
        setMicPermission(false)
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice communication",
          variant: "destructive",
        })
      }
    }

    initializeAudio()

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  // Set up Supabase Realtime channel for audio communication
  useEffect(() => {
    if (!supabaseClient.current || !currentChannel) return

    // Clean up existing channel
    if (realtimeChannel) {
      supabaseClient.current.removeChannel(realtimeChannel)
    }

    // Create new channel for current walkie-talkie channel
    const channel = supabaseClient.current.channel(`walkie_talkie_${currentChannel}`, {
      config: {
        broadcast: { self: false }, // Don't receive our own broadcasts
      },
    })

    // Listen for audio broadcasts
    channel.on("broadcast", { event: "audio_transmission" }, (payload) => {
      const { transmission_id, user_id, user_name, audio_data, timestamp } = payload.payload

      // Only process if it's not from us and we haven't processed it already
      if (user_id !== currentUser.id && transmission_id !== lastProcessedId) {
        setLastProcessedId(transmission_id)

        try {
          // Convert base64 to blob
          const binaryString = atob(audio_data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBlob = new Blob([bytes], { type: "audio/webm;codecs=opus" })

          // Play the received audio
          playReceivedAudioBlob(audioBlob, user_name)
        } catch (error) {
          console.error("Error processing received audio:", error)
        }
      }
    })

    // Listen for presence updates
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat()
      setChannelUsers(users)
    })

    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("User joined:", newPresences)
    })

    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("User left:", leftPresences)
    })

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnectedToRealtime(true)
        setIsOnline(true)

        // Track presence
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          online_at: new Date().toISOString(),
        })

        console.log(`Connected to walkie-talkie channel: ${currentChannel}`)
        toast({
          title: "Connected",
          description: `Connected to ${channels.find((c) => c.id === currentChannel)?.name || "Unknown"} channel`,
          duration: 2000,
        })
      } else if (status === "CHANNEL_ERROR") {
        setIsConnectedToRealtime(false)
        setIsOnline(false)
        console.error("Error connecting to realtime channel")
      } else if (status === "TIMED_OUT") {
        setIsConnectedToRealtime(false)
        setIsOnline(false)
        console.error("Realtime connection timed out")
      }
    })

    setRealtimeChannel(channel)

    return () => {
      if (channel) {
        supabaseClient.current.removeChannel(channel)
      }
    }
  }, [currentChannel, currentUser.id, currentUser.name])

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const { data, error } = await supabaseClient.current
          .from("walkie_talkie_channels")
          .select("*")
          .eq("is_active", true)

        if (error) {
          console.warn("Error loading channels:", error.message)
          return
        }

        if (data && data.length > 0) {
          setChannels(data)
          setCurrentChannel(data[0].id)
        }
      } catch (error) {
        console.warn("Failed to load channels:", error)
      }
    }

    loadChannels()
  }, [])

  // Handle audio recording and transmission
  const startTransmission = async () => {
    if (isTransmitting || !mediaStream || !micPermission || !isConnectedToRealtime) return

    setIsTransmitting(true)

    try {
      mediaRecorder.current = new MediaRecorder(mediaStream, {
        mimeType: "audio/webm;codecs=opus",
      })

      const chunks = []
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" })
        const transmissionId = `transmission-${Date.now()}-${currentUser.id}`
        const timestamp = Date.now()

        // Convert blob to base64 for transmission
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64data = reader.result.split(",")[1]

          // Broadcast the audio via Supabase Realtime
          if (realtimeChannel && isConnectedToRealtime) {
            try {
              await realtimeChannel.send({
                type: "broadcast",
                event: "audio_transmission",
                payload: {
                  transmission_id: transmissionId,
                  user_id: currentUser.id,
                  user_name: currentUser.name,
                  audio_data: base64data,
                  timestamp: timestamp,
                  channel_id: currentChannel,
                },
              })

              console.log("Audio broadcast sent successfully")
            } catch (error) {
              console.error("Error broadcasting audio:", error)
              toast({
                title: "Transmission Failed",
                description: "Failed to send audio. Please try again.",
                variant: "destructive",
              })
            }
          }
        }
        reader.readAsDataURL(audioBlob)

        // Save transmission record to database
        try {
          const { error } = await supabaseClient.current.from("walkie_talkie_transmissions").insert({
            id: transmissionId,
            channel_id: currentChannel,
            user_name: currentUser.name,
            user_id: currentUser.id,
            is_active: false,
            started_at: new Date(timestamp).toISOString(),
            ended_at: new Date(timestamp).toISOString(),
          })

          if (error) {
            console.warn("Error saving transmission:", error.message)
          }
        } catch (error) {
          console.warn("Failed to save transmission record:", error)
        }

        // In demo mode, play back the audio locally
        if (demoMode) {
          setTimeout(() => {
            playReceivedAudioBlob(audioBlob, currentUser.name)
          }, 500)
        }

        toast({
          title: "Transmission Sent",
          description: `Audio sent to ${channels.find((c) => c.id === currentChannel)?.name || "Unknown"} channel`,
          duration: 1500,
        })
      }

      mediaRecorder.current.start()

      // Update active transmission status
      try {
        await supabaseClient.current.from("walkie_talkie_transmissions").upsert({
          id: `active-${currentUser.id}`,
          channel_id: currentChannel,
          user_name: currentUser.name,
          user_id: currentUser.id,
          is_active: true,
          started_at: new Date().toISOString(),
        })
      } catch (error) {
        console.warn("Error updating active status:", error)
      }

      playBeep(800, 100)

      toast({
        title: "Transmission Started",
        description: `Broadcasting on ${channels.find((c) => c.id === currentChannel)?.name || "Unknown"} channel`,
        duration: 1000,
      })

      transmitTimer.current = setTimeout(() => {
        endTransmission()
        toast({
          title: "Transmission timeout",
          description: "Your transmission was automatically ended after 30 seconds",
          variant: "default",
        })
      }, 30000)
    } catch (error) {
      console.error("Error starting transmission:", error)
      setIsTransmitting(false)
    }
  }

  const endTransmission = async () => {
    if (!isTransmitting) return

    setIsTransmitting(false)

    if (transmitTimer.current) {
      clearTimeout(transmitTimer.current)
      transmitTimer.current = null
    }

    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop()
    }

    try {
      await supabaseClient.current.from("walkie_talkie_transmissions").delete().eq("id", `active-${currentUser.id}`)
      playBeep(400, 200)
    } catch (error) {
      console.warn("Failed to end transmission:", error)
    }
  }

  const playBeep = (frequency, duration) => {
    if (!audioContext || isMuted) return

    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime((volume / 100) * 0.3, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.warn("Error playing beep:", error)
    }
  }

  // Play received audio from blob
  const playReceivedAudioBlob = async (audioBlob, userName) => {
    if (!audioBlob || isMuted) return

    try {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.volume = volume / 100

      audio.onloadstart = () => {
        setIsReceiving(true)
        toast({
          title: "Receiving Transmission",
          description: `From ${userName}`,
          duration: 2000,
        })
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsReceiving(false)
      }

      audio.onerror = () => {
        console.warn("Error playing audio")
        setIsReceiving(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.warn("Error playing received audio:", error)
      setIsReceiving(false)
    }
  }

  // Listen for active transmissions
  useEffect(() => {
    const checkActiveTransmissions = async () => {
      try {
        const { data: activeData } = await supabaseClient.current
          .from("walkie_talkie_transmissions")
          .select("user_name, user_id, started_at")
          .eq("channel_id", currentChannel)
          .eq("is_active", true)

        setActiveUsers(activeData || [])
      } catch (error) {
        console.warn("Failed to check active transmissions:", error)
      }
    }

    const interval = setInterval(checkActiveTransmissions, 2000)
    checkActiveTransmissions()

    return () => clearInterval(interval)
  }, [currentChannel])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat && !e.target.matches("input, textarea, select, button")) {
        e.preventDefault()
        startTransmission()
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === "Space" && isTransmitting && !e.target.matches("input, textarea, select, button")) {
        e.preventDefault()
        endTransmission()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isTransmitting])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Walkie Talkie
          </CardTitle>
          <div className="flex items-center gap-2">
            {micPermission === false && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No Mic
              </Badge>
            )}
            <Badge variant={isConnectedToRealtime ? "default" : "secondary"} className="flex items-center gap-1">
              {isConnectedToRealtime ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnectedToRealtime ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {micPermission === false && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Microphone access is required for voice communication. Please refresh the page and allow microphone
              access.
            </p>
          </div>
        )}

        {!isConnectedToRealtime && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Not connected to real-time communication. Please check your internet connection.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Channel</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {channelUsers.length} online
            </div>
          </div>
          <Select value={currentChannel} onValueChange={setCurrentChannel}>
            <SelectTrigger>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Volume</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          <Slider
            value={[100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              setVolume(value[0])
              if (value[0] === 0) {
                setIsMuted(true)
              } else if (isMuted) {
                setIsMuted(false)
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Demo Mode</span>
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDemoMode(!demoMode)
              toast({
                title: demoMode ? "Demo Mode Disabled" : "Demo Mode Enabled",
                description: demoMode
                  ? "Switching to normal operation mode"
                  : "Audio will be played back locally for testing",
                duration: 3000,
              })
            }}
          >
            {demoMode ? "Demo Mode ON" : "Demo Mode OFF"}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Channel Users</h4>
          <div className="rounded-md bg-muted p-3 min-h-[60px]">
            {channelUsers.length > 0 ? (
              <div className="space-y-1">
                {channelUsers.map((user, index) => (
                  <div key={`${user.user_id}-${index}`} className="flex items-center gap-2 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <span>{user.user_name}</span>
                    {user.user_id === currentUser.id && <span className="text-xs text-muted-foreground">(You)</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">No users online in this channel</div>
            )}
          </div>
        </div>

        <div className="rounded-md bg-muted p-3">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">
              {isReceiving ? "Receiving Transmission..." : "Active Transmissions"}
            </h4>
            <div className="min-h-[40px] text-sm">
              {isReceiving && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
                  </span>
                  <span className="font-medium">Receiving audio transmission...</span>
                </div>
              )}
              {activeUsers.length > 0 ? (
                <div className="space-y-2">
                  {activeUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-2 bg-green-50 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                        </span>
                        <span className="font-medium">{user.user_name} is transmitting</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isReceiving ? (
                <div className="text-sm text-muted-foreground text-center">No active transmissions</div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className={`relative w-full ${isTransmitting ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
          size="lg"
          disabled={!micPermission || !isConnectedToRealtime}
          onMouseDown={startTransmission}
          onMouseUp={endTransmission}
          onMouseLeave={isTransmitting ? endTransmission : undefined}
          onTouchStart={startTransmission}
          onTouchEnd={endTransmission}
        >
          {isTransmitting ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          {isTransmitting && (
            <span className="absolute right-2 top-2 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
