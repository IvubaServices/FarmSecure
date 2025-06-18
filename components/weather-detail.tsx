"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Cloud,
  CloudRain,
  Sun,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRealtime } from "@/contexts/realtime-context"
import { useToast } from "@/hooks/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"

// Fallback API key in case database fetch fails
const FALLBACK_API_KEY = "eb6cafb28d853f82a0c2586391d7d875"

type WeatherData = {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    temp_min: number
    temp_max: number
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
    sunrise: number
    sunset: number
  }
  dt: number
  visibility: number
}

type MapConfig = {
  id: string
  name: string
  centerLatitude: number
  centerLongitude: number
  isActive: boolean
}

export function WeatherDetail() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const { fireZones } = useRealtime()
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState<string | null>(null)

  const fetchMapConfig = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from("map_config")
        .select("id, name, center_latitude, center_longitude, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("Error fetching map config:", error)
        return null
      }

      if (data) {
        setMapConfig({
          id: data.id,
          name: data.name,
          centerLatitude: data.center_latitude,
          centerLongitude: data.center_longitude,
          isActive: data.is_active,
        })
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
        .order("created_at", { ascending: false }) // Get the latest if multiple active
        .limit(1) // We only want one
        .maybeSingle() // Returns null if no rows, or the single object

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

  const getCoordinates = () => {
    // First priority: Use active map configuration from database
    if (mapConfig) {
      return {
        lat: mapConfig.centerLatitude,
        lon: mapConfig.centerLongitude,
        locationName: mapConfig.name,
      }
    }

    // Second priority: Check if there are any active fire zones
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

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchApiKey()
      await fetchMapConfig()
      await fetchWeatherData()
      toast({
        title: "Weather Updated",
        description: "Weather data has been refreshed",
      })
    } catch (err) {
      // Error is already handled in fetchWeatherData
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch API key, map config and weather data on component mount and every minute
  useEffect(() => {
    const fetchData = async () => {
      await fetchApiKey()
      await fetchMapConfig()
      fetchWeatherData()
    }

    fetchData()

    const intervalId = setInterval(fetchData, 60 * 1000)

    return () => clearInterval(intervalId)
  }, [fireZones])

  // Get weather icon based on weather condition code
  const getWeatherIcon = (weatherId: number, size = 10) => {
    if (weatherId >= 200 && weatherId < 300) {
      return <CloudLightning className={`h-${size} w-${size} text-amber-500`} />
    } else if (weatherId >= 300 && weatherId < 600) {
      return <CloudRain className={`h-${size} w-${size} text-blue-500`} />
    } else if (weatherId >= 600 && weatherId < 700) {
      return <CloudSnow className={`h-${size} w-${size} text-blue-200`} />
    } else if (weatherId >= 700 && weatherId < 800) {
      return <CloudFog className={`h-${size} w-${size} text-gray-400`} />
    } else if (weatherId === 800) {
      return <Sun className={`h-${size} w-${size} text-yellow-400`} />
    } else if (weatherId > 800) {
      return <Cloud className={`h-${size} w-${size} text-gray-400`} />
    }

    return <Cloud className={`h-${size} w-${size} text-gray-400`} />
  }

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get wind direction from degrees
  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  if (loading && !weatherData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="mr-2 h-5 w-5" />
            Weather Conditions
          </CardTitle>
          <CardDescription>Current weather at the farm</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error && !weatherData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="mr-2 h-5 w-5" />
            Weather Conditions
          </CardTitle>
          <CardDescription>Current weather at the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">Unable to load weather data</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { locationName } = getCoordinates()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Thermometer className="mr-2 h-5 w-5" />
              Weather at {locationName}
            </CardTitle>
            <CardDescription>
              Last updated: {weatherData ? new Date(weatherData.dt * 1000).toLocaleString() : ""} (auto-refreshes every
              minute)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh weather</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {weatherData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weatherData.weather[0].id, 16)}
                <div>
                  <div className="text-4xl font-bold">{Math.round(weatherData.main.temp)}°C</div>
                  <p className="text-sm text-muted-foreground capitalize">{weatherData.weather[0].description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">Feels like: {Math.round(weatherData.main.feels_like)}°C</div>
                <div className="text-sm text-muted-foreground">
                  Min: {Math.round(weatherData.main.temp_min)}°C / Max: {Math.round(weatherData.main.temp_max)}°C
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
                <Wind className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Wind</span>
                <span className="font-medium">{Math.round(weatherData.wind.speed)} m/s</span>
                <span className="text-xs text-muted-foreground">{getWindDirection(weatherData.wind.deg)}</span>
              </div>

              <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Humidity</span>
                <span className="font-medium">{weatherData.main.humidity}%</span>
              </div>

              <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Pressure</span>
                <span className="font-medium">{weatherData.main.pressure} hPa</span>
              </div>

              <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
                <Sun className="h-5 w-5 text-yellow-400" />
                <span className="text-xs text-muted-foreground">Sunrise/Sunset</span>
                <span className="font-medium">{formatTime(weatherData.sys.sunrise)}</span>
                <span className="text-xs text-muted-foreground">{formatTime(weatherData.sys.sunset)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
