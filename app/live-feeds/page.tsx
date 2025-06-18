"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Head from "next/head"
import Script from "next/script"
// Removed: import { createClientSupabaseClient } from "@/lib/supabase" // No longer fetching directly
import { AlertTriangle, VideoOff, WifiOff, Loader2 } from "lucide-react"

interface CameraFeed {
  id: string
  url: string // stream_url from DB
  title: string
  error?: string
}

declare global {
  interface Window {
    Hls: any
  }
  var Hls: any // Allow Hls to be used as a global variable after script load
}

export default function LiveFeedsPage() {
  const hlsInstancesRef = useRef<any[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [hlsScriptLoaded, setHlsScriptLoaded] = useState(false)
  const [feeds, setFeeds] = useState<CameraFeed[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  // const [fullscreenFeedId, setFullscreenFeedId] = useState<string | null>(null) // Fullscreen logic can be added back later

  // Removed: const supabase = createClientSupabaseClient() // No longer needed

  useEffect(() => {
    const fetchFeedSettingsFromAPI = async () => {
      console.log("[LiveFeedsPage] Fetching feed settings from API...")
      setLoadingSettings(true)
      setSettingsError(null)
      try {
        const response = await fetch("/api/live-feed-settings")
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `API request failed with status ${response.status}`)
        }
        const data: CameraFeed[] = await response.json()
        console.log("[LiveFeedsPage] Feed settings fetched from API:", data)
        setFeeds(data)
      } catch (error: any) {
        console.error("[LiveFeedsPage] Error fetching live feed settings from API:", error)
        setSettingsError(`Failed to load feed settings: ${error.message}`)
        setFeeds([])
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchFeedSettingsFromAPI()
  }, []) // Empty dependency array, fetch once on mount

  useEffect(() => {
    if (!hlsScriptLoaded || typeof Hls === "undefined" || feeds.length === 0) {
      if (feeds.length > 0 && !hlsScriptLoaded) {
        console.log("[LiveFeedsPage HLS Effect] Waiting for HLS script to load.")
      }
      return
    }
    console.log(
      "[LiveFeedsPage HLS Effect] HLS script loaded, Hls object available, feeds present. Setting up players.",
    )

    // Ensure videoRefs array is sized correctly for the current feeds
    if (videoRefs.current.length !== feeds.length) {
      console.log(`[LiveFeedsPage HLS Effect] Resizing videoRefs from ${videoRefs.current.length} to ${feeds.length}`)
      videoRefs.current = Array(feeds.length).fill(null)
    }

    // Clear previous HLS instances before setting up new ones
    hlsInstancesRef.current.forEach((hlsInstance) => {
      if (hlsInstance) {
        console.log("[LiveFeedsPage HLS Effect] Destroying old HLS instance.")
        hlsInstance.destroy()
      }
    })
    hlsInstancesRef.current = [] // Reset the array

    feeds.forEach((feed, index) => {
      const videoElement = videoRefs.current[index]

      if (!videoElement) {
        console.warn(
          `[LiveFeedsPage HLS Effect] Video element ref for feed id ${feed.id} (index ${index}) is null. Skipping HLS setup for this feed. This might happen if refs are not ready yet.`,
        )
        return
      }
      console.log(
        `[LiveFeedsPage HLS Effect] Setting up HLS for feed: ${feed.title} (URL: ${feed.url}) on video element:`,
        videoElement,
      )

      if (Hls.isSupported()) {
        const hls = new Hls({
          // Consider more robust error handling and retry configurations
          // manifestLoadPolicy: { default: { timeoutRetry: { maxNumRetry: 1, retryDelayMs: 1000, maxRetryDelayMs: 1000 } } },
          // fragLoadPolicy: { default: { timeoutRetry: { maxNumRetry: 1, retryDelayMs: 1000, maxRetryDelayMs: 1000 } } },
          // debug: true // Enable HLS debug logs for more detailed output in console
        })
        hlsInstancesRef.current[index] = hls

        if (
          feed.url &&
          (feed.url.startsWith("http://") || feed.url.startsWith("https://")) &&
          !feed.url.includes("your-stream-url.example.com") // Basic placeholder check
        ) {
          console.log(`[LiveFeedsPage HLS Effect] Loading source for ${feed.title}: ${feed.url}`)
          hls.loadSource(feed.url)
          hls.attachMedia(videoElement)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log(`[LiveFeedsPage HLS Event] Manifest parsed for ${feed.title}. Attempting to play.`)
            videoElement.play().catch((playError) => {
              console.error(`[LiveFeedsPage HLS Event] Error playing video ${feed.title}:`, playError)
              setFeeds((prevFeeds) =>
                prevFeeds.map((f, i) => (i === index ? { ...f, error: `Playback error: ${playError.message}` } : f)),
              )
            })
          })

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error(`[LiveFeedsPage HLS Event] HLS.js error for ${feed.title}:`, event, data)
            let errorMessage = `HLS Error: ${data.details || data.type}`
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              errorMessage = "Network error. Check URL, CORS, or connectivity."
              if (
                data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT
              ) {
                errorMessage += " Problem loading manifest."
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              errorMessage = "Media error. Problem with video/audio data."
              if (data.details === Hls.ErrorDetails.FRAG_DECODE_ERROR) {
                errorMessage += " Fragment decoding issue."
              }
            }
            setFeeds((prevFeeds) => prevFeeds.map((f, i) => (i === index ? { ...f, error: errorMessage } : f)))
          })
        } else {
          const warningMessage = `[LiveFeedsPage HLS Effect] Skipping HLS load for ${feed.title}: Invalid or placeholder URL: ${feed.url}`
          console.warn(warningMessage)
          setFeeds((prevFeeds) =>
            prevFeeds.map((f, i) => (i === index ? { ...f, error: "Invalid or placeholder URL" } : f)),
          )
        }
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        console.log(
          `[LiveFeedsPage HLS Effect] HLS.js not supported, but native HLS might be. Setting src for ${feed.title} to ${feed.url}`,
        )
        videoElement.src = feed.url
        videoElement.addEventListener("loadedmetadata", () => {
          videoElement.play().catch((playError) => {
            console.error(`[LiveFeedsPage Native HLS] Error playing video ${feed.title}:`, playError)
            setFeeds((prevFeeds) =>
              prevFeeds.map((f, i) =>
                i === index ? { ...f, error: `Native HLS Playback error: ${playError.message}` } : f,
              ),
            )
          })
        })
        videoElement.addEventListener("error", (nativeError) => {
          console.error(`[LiveFeedsPage Native HLS] Native HLS error for ${feed.title}:`, nativeError)
          setFeeds((prevFeeds) =>
            prevFeeds.map((f, i) => (i === index ? { ...f, error: "Native HLS playback error." } : f)),
          )
        })
      } else {
        const unsupportedMessage = `[LiveFeedsPage HLS Effect] HLS not supported by HLS.js or natively for ${feed.title}.`
        console.warn(unsupportedMessage)
        setFeeds((prevFeeds) =>
          prevFeeds.map((f, i) => (i === index ? { ...f, error: "HLS not supported in this browser" } : f)),
        )
      }
    })

    return () => {
      console.log("[LiveFeedsPage HLS Effect] Cleanup: Destroying all HLS instances.")
      hlsInstancesRef.current.forEach((hlsInstance) => {
        if (hlsInstance) hlsInstance.destroy()
      })
      hlsInstancesRef.current = []
    }
  }, [hlsScriptLoaded, feeds]) // Rerun when HLS script loads or feeds data changes

  const handleScriptLoad = () => {
    console.log("[LiveFeedsPage] Hls.js script loaded successfully.")
    setHlsScriptLoaded(true)
  }
  const handleScriptError = (e: any) => {
    console.error("[LiveFeedsPage] Failed to load Hls.js script", e)
    setSettingsError("Failed to load video player library. Live feeds may not work.")
  }

  const assignVideoRef = useCallback((el: HTMLVideoElement | null, index: number) => {
    // This callback ensures videoRefs.current is populated as video elements render.
    // The HLS useEffect depends on `feeds`, so when `feeds` changes and new video elements are rendered,
    // this callback will run for each, and then the HLS useEffect will run.
    if (el) {
      console.log(`[LiveFeedsPage assignVideoRef] Assigning ref for index ${index}:`, el)
    }
    // Ensure the array is large enough.
    if (index >= videoRefs.current.length) {
      const newLength = index + 1
      const oldRefs = videoRefs.current
      videoRefs.current = Array(newLength).fill(null)
      oldRefs.forEach((ref, i) => (videoRefs.current[i] = ref))
    }
    videoRefs.current[index] = el
  }, []) // No dependencies, stable callback

  return (
    <>
      <Head>
        <title>Live Camera Feeds</title>
      </Head>
      <Script
        src="https://cdn.jsdelivr.net/npm/hls.js@latest"
        strategy="afterInteractive" // Load after page becomes interactive
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Live Camera Feeds</h1>

        {loadingSettings && (
          <div className="text-center py-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading feed settings...
          </div>
        )}
        {settingsError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center" role="alert">
            <AlertTriangle className="h-5 w-5 mr-3" /> <p>{settingsError}</p>
          </div>
        )}

        {!loadingSettings && !settingsError && feeds.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <VideoOff className="h-16 w-16 mx-auto mb-4" />
            <p className="text-xl">No live feeds configured or enabled.</p>
            <p>Please add or enable feeds in the settings, or check for errors above.</p>
          </div>
        )}

        {!loadingSettings && !settingsError && feeds.length > 0 && (
          <>
            {!hlsScriptLoaded && (
              <div className="text-center py-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading video player library...
              </div>
            )}
            {/* The "Initializing video players..." message was tied to `refsReady` which wasn't used effectively.
                The HLS setup effect now handles its own logging for readiness. */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
              {feeds.map((feed, index) => (
                <div
                  key={feed.id}
                  className={`border rounded-lg shadow-lg overflow-hidden bg-gray-800 transition-all duration-300 ease-in-out relative`}
                >
                  <div className={`flex items-center p-3 bg-gray-700 text-white`}>
                    <h2 className="text-xl font-semibold truncate" title={feed.title}>
                      {feed.title}
                    </h2>
                  </div>
                  <div className={`aspect-video bg-black flex items-center justify-center text-white`}>
                    {feed.error ? (
                      <div className="p-4 text-center">
                        <WifiOff className="h-12 w-12 mx-auto mb-2 text-red-400" />
                        <p className="font-semibold">Stream Error</p>
                        <p className="text-xs text-gray-300 px-2 break-words">{feed.error}</p>
                      </div>
                    ) : (
                      <video
                        ref={(el) => assignVideoRef(el, index)}
                        id={`video-${feed.id}`} // Ensure unique ID for video elements
                        width="100%"
                        // height="auto" // Let aspect-video handle height
                        controls
                        autoPlay
                        muted // Muted is often required for autoplay to work
                        playsInline // Important for iOS
                        className="w-full h-full object-contain"
                      ></video>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
