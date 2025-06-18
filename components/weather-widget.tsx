"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, CloudLightning, CloudSnow, CloudFog, Wind, Loader2 } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { createClientSupabaseClient } from "@/lib/supabase"

// Fallback API key in case database fetch fails
const FALLBACK_API_KEY = "eb6cafb28d853f82a0c2586391d7d875"

type WeatherData = {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  wind: {
    speed: number
    deg: number
  }
  name: string
  sys: {
    country: string
  }
  dt: number
}

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fireZones } = useRealtime()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [mapConfig, setMapConfig] = useState<{ name: string } | null>(null)

  // Get coordinates from active fire zones or use default farm location
  const getCoordinates = () => {
    // Check if there are any active fire zones
    const activeFireZones = fireZones.filter((zone) => zone.status === "Active")

    if (activeFireZones.length > 0) {
      // Use the most recent active fire zone
      const mostRecentZone = activeFireZones.sort(
        (a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime(),
      )[0]

      return {
        lat: mostRecentZone.latitude,
        lon: mostRecentZone.longitude,
        locationName: mostRecentZone.name,
      }
    }

    // Default coordinates (farm center)
    return {
      lat: -25.7479,
      lon: 28.2293,
      locationName: "Farm Center",
    }
  }

  const fetchMapConfig = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from("map_config")
        .select("name")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("Error fetching map config:", error)
        return null
      }

      if (data) {
        setMapConfig(data)
      }
    } catch (err) {
      console.error("Error in fetchMapConfig:", err)
    }
  }

  const fetchApiKey = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from("api_keys")
        .select("key_value")
        .eq("service", "weather")
        .eq("key_name", "openweathermap")
        .eq("is_active", true)
        .order("created_at", { ascending: false }) // Good practice to get the newest if multiple could exist
        .limit(1) // Ensure only one row is considered
        .maybeSingle() // Safely handles 0 or 1 row

      if (error) {
        console.error("Error fetching API key:", error)
        // Use fallback API key
        setApiKey(FALLBACK_API_KEY)
        return FALLBACK_API_KEY
      }

      if (data && data.key_value) {
        setApiKey(data.key_value)
        return data.key_value
      }

      // Use fallback if no data
      setApiKey(FALLBACK_API_KEY)
      return FALLBACK_API_KEY
    } catch (err) {
      console.error("Error in fetchApiKey:", err)
      // Use fallback API key
      setApiKey(FALLBACK_API_KEY)
      return FALLBACK_API_KEY
    }
  }

  const fetchWeatherData = async () => {
    setLoading(true)
    setError(null)

    try {
      // First ensure we have an API key
      const key = apiKey || (await fetchApiKey())

      const { lat, lon } = getCoordinates()
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch weather data")
      }

      const data = await response.json()
      setWeatherData(data)
    } catch (err) {
      console.error("Error fetching weather data:", err)
      setError("Could not load weather data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch API key, map config, then weather data on component mount and every 30 minutes
  useEffect(() => {
    const fetchData = async () => {
      await fetchApiKey()
      await fetchMapConfig()
      fetchWeatherData()
    }

    fetchData()

    const intervalId = setInterval(fetchData, 30 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [fireZones])

  // Get weather icon based on weather condition code
  const getWeatherIcon = (weatherId: number) => {
    if (weatherId >= 200 && weatherId < 300) {
      return <CloudLightning className="h-10 w-10 text-amber-500" />
    } else if (weatherId >= 300 && weatherId < 600) {
      return <CloudRain className="h-10 w-10 text-blue-500" />
    } else if (weatherId >= 600 && weatherId < 700) {
      return <CloudSnow className="h-10 w-10 text-blue-200" />
    } else if (weatherId >= 700 && weatherId < 800) {
      return <CloudFog className="h-10 w-10 text-gray-400" />
    } else if (weatherId === 800) {
      return <Sun className="h-10 w-10 text-yellow-400" />
    } else if (weatherId > 800) {
      return <Cloud className="h-10 w-10 text-gray-400" />
    }

    return <Cloud className="h-10 w-10 text-gray-400" />
  }

  if (loading) {
    return (
      <Card className="bg-background/5 backdrop-blur">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error || !weatherData) {
    return (
      <Card className="bg-background/5 backdrop-blur">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Weather</p>
            <div className="text-sm text-muted-foreground">Unable to load weather data</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { locationName } = getCoordinates()

  return (
    <Card className="bg-background/5 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">Weather at {mapConfig?.name || locationName}</p>
            <div className="text-3xl font-bold">{Math.round(weatherData.main.temp)}°C</div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground capitalize">{weatherData.weather[0].description}</p>
              <span className="text-xs text-muted-foreground">|</span>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{Math.round(weatherData.wind.speed)} m/s</p>
              </div>
            </div>
          </div>
          <div>{getWeatherIcon(weatherData.weather[0].id)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
