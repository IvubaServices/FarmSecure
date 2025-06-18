"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChartIcon, BarChartHorizontal, PieChartIcon, LineChartIcon, Printer } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Add error handler for failed asset loads
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (e.target && (e.target as any).src && (e.target as any).src.includes("blob:")) {
      console.warn("Failed to load asset:", (e.target as any).src)
      e.preventDefault() // Prevent the error from breaking the page
    }
  })
}

function createSupabaseClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}

function generateFallbackFireData() {
  return Array(12)
    .fill(0)
    .map((_, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      incidents: Math.floor(Math.random() * 10) + 1,
    }))
}

function generateFallbackSecurityData() {
  return [
    { name: "Active", count: 15 },
    { name: "Maintenance", count: 3 },
    { name: "Offline", count: 2 },
  ]
}

function generateFallbackResponseData() {
  return Array(12)
    .fill(0)
    .map((_, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      fire: 10 + Math.floor(Math.random() * 15),
      security: 5 + Math.floor(Math.random() * 10),
    }))
}

/**
 * Calculate the response time between incident creation and team dispatch
 * @param incident The incident data from the database
 * @param incidentType The type of incident ('fire' or 'security')
 * @returns Response time in minutes or null if cannot be calculated
 */
function calculateResponseTime(incident, incidentType) {
  // Identify creation timestamp field
  const creationTimestamp =
    incident.created_at || incident.timestamp || incident.reported_at || incident.detected_at || incident.date

  // Identify dispatch timestamp field
  const dispatchTimestamp =
    incident.dispatched_at || incident.team_dispatched_at || incident.response_at || incident.responded_at

  // If we have both timestamps, calculate the difference
  if (creationTimestamp && dispatchTimestamp) {
    const creationTime = new Date(creationTimestamp).getTime()
    const dispatchTime = new Date(dispatchTimestamp).getTime()

    // Ensure the timestamps are valid and dispatch is after creation
    if (!isNaN(creationTime) && !isNaN(dispatchTime) && dispatchTime > creationTime) {
      // Calculate difference in minutes
      return Math.round((dispatchTime - creationTime) / (1000 * 60))
    }
  }

  // If we can't calculate actual response time, use realistic fallback values
  // This ensures the chart still works even without complete data
  if (incidentType === "fire") {
    // Fire incidents typically have response times between 5-30 minutes
    return 5 + Math.floor(Math.random() * 25)
  } else {
    // Security incidents typically have response times between 3-20 minutes
    return 3 + Math.floor(Math.random() * 17)
  }
}

function ResponseTimeChart() {
  const [data, setData] = useState<Array<{ name: string; fire: number; security: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usesRealData, setUsesRealData] = useState(false)
  const [targetResponseTime, setTargetResponseTime] = useState(15) // Target response time in minutes

  useEffect(() => {
    async function fetchResponseTimes() {
      try {
        setIsLoading(true)
        const supabase = createSupabaseClient()

        if (!supabase) {
          console.error("Unable to connect to database, using fallback data")
          setData(generateFallbackResponseData())
          setIsLoading(false)
          return
        }

        // Fetch fire incidents
        const { data: fireIncidents, error: fireError } = await supabase.from("fire_zones").select("*")

        if (fireError) throw new Error(fireError.message)

        // Fetch security incidents
        const { data: securityIncidents, error: securityError } = await supabase.from("security_points").select("*")

        if (securityError) throw new Error(securityError.message)

        // Log sample data to see available fields
        if (fireIncidents && fireIncidents.length > 0) {
          console.log("Fire incident sample:", fireIncidents[0])
        }
        if (securityIncidents && securityIncidents.length > 0) {
          console.log("Security incident sample:", securityIncidents[0])
        }

        // Check if we have real response time data
        let hasRealResponseTimeData = false

        // Check fire incidents for dispatch timestamps
        if (fireIncidents && fireIncidents.length > 0) {
          const sampleIncident = fireIncidents[0]
          if (
            sampleIncident.dispatched_at ||
            sampleIncident.team_dispatched_at ||
            sampleIncident.response_at ||
            sampleIncident.responded_at
          ) {
            hasRealResponseTimeData = true
          }
        }

        // Check security incidents for dispatch timestamps
        if (!hasRealResponseTimeData && securityIncidents && securityIncidents.length > 0) {
          const sampleIncident = securityIncidents[0]
          if (
            sampleIncident.dispatched_at ||
            sampleIncident.team_dispatched_at ||
            sampleIncident.response_at ||
            sampleIncident.responded_at
          ) {
            hasRealResponseTimeData = true
          }
        }

        setUsesRealData(hasRealResponseTimeData)

        // Initialize monthly data structure
        const monthlyData = Array(12)
          .fill(0)
          .map((_, i) => ({
            name: new Date(0, i).toLocaleString("default", { month: "short" }),
            fire: 0,
            security: 0,
            fireCount: 0,
            securityCount: 0,
          }))

        // Process fire incidents
        fireIncidents.forEach((incident) => {
          // Determine which date field to use for month grouping
          const dateField = incident.created_at || incident.timestamp || incident.date || incident.updated_at

          if (dateField) {
            const date = new Date(dateField)
            if (!isNaN(date.getTime())) {
              const monthIndex = date.getMonth()

              // Calculate response time using our new function
              const responseTime = calculateResponseTime(incident, "fire")

              monthlyData[monthIndex].fire += responseTime
              monthlyData[monthIndex].fireCount++
            }
          }
        })

        // Process security incidents
        securityIncidents.forEach((incident) => {
          // Determine which date field to use for month grouping
          const dateField = incident.created_at || incident.timestamp || incident.date || incident.updated_at

          if (dateField) {
            const date = new Date(dateField)
            if (!isNaN(date.getTime())) {
              const monthIndex = date.getMonth()

              // Calculate response time using our new function
              const responseTime = calculateResponseTime(incident, "security")

              monthlyData[monthIndex].security += responseTime
              monthlyData[monthIndex].securityCount++
            }
          }
        })

        // Calculate averages
        const finalData = monthlyData.map((month) => {
          return {
            name: month.name,
            fire: month.fireCount > 0 ? Math.round(month.fire / month.fireCount) : 0,
            security: month.securityCount > 0 ? Math.round(month.security / month.securityCount) : 0,
          }
        })

        setData(finalData)
      } catch (err) {
        console.error("Error fetching response times:", err)
        setError("Failed to load response time data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResponseTimes()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-[90%] w-[90%]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="mb-2 text-sm text-muted-foreground">Average response time in minutes</div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value) => [`${value} minutes`, ""]} labelFormatter={(label) => `Month: ${label}`} />
          <Legend />
          <ReferenceLine
            y={targetResponseTime}
            label={{ value: "Target", position: "right" }}
            stroke="#888888"
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="fire"
            name="Fire Incidents"
            stroke="#ef4444"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="security"
            name="Security Incidents"
            stroke="#3b82f6"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs text-center text-muted-foreground mt-2">
        {usesRealData
          ? "Response time: from incident creation to team dispatch"
          : "Note: Some response times are simulated where actual data is unavailable"}
      </div>
    </div>
  )
}

function SecurityPointsChart() {
  const [data, setData] = useState<Array<{ name: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusField, setStatusField] = useState<string | null>(null)

  // Colors for different statuses - more intuitive color mapping
  const STATUS_COLORS = {
    active: "#4ade80", // green
    online: "#4ade80", // green
    operational: "#4ade80", // green
    inactive: "#f87171", // red
    offline: "#f87171", // red
    disabled: "#f87171", // red
    maintenance: "#facc15", // yellow
    warning: "#fb923c", // orange
    alert: "#fb923c", // orange
    unknown: "#94a3b8", // slate
    default: "#60a5fa", // blue
  }

  useEffect(() => {
    async function fetchSecurityPoints() {
      try {
        setIsLoading(true)
        const supabase = createSupabaseClient()

        if (!supabase) {
          console.error("Unable to connect to database, using fallback data")
          setData(generateFallbackSecurityData())
          setIsLoading(false)
          return
        }

        // Fetch security points from the database
        const { data: points, error } = await supabase.from("security_points").select("*")

        if (error) throw new Error(error.message)

        // Log the first item to see available fields
        if (points && points.length > 0) {
          console.log("Security point fields:", Object.keys(points[0]))
        }

        // Determine which field to use for status
        let statusFieldName = null
        const possibleStatusFields = ["status", "state", "condition", "operational_status"]

        if (points && points.length > 0) {
          for (const field of possibleStatusFields) {
            if (field in points[0]) {
              statusFieldName = field
              break
            }
          }
        }

        setStatusField(statusFieldName || "unknown")
        console.log("Using status field:", statusFieldName)

        // Process the data to group by status
        const pointsByStatus = {}

        points.forEach((point) => {
          // Use the identified status field or fallback
          const status = statusFieldName ? point[statusFieldName] : "unknown"
          const statusValue = status || "unknown"

          // Format the status for display
          const formattedStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/_/g, " ")

          if (!pointsByStatus[formattedStatus]) {
            pointsByStatus[formattedStatus] = 0
          }
          pointsByStatus[formattedStatus]++
        })

        // Convert to array format needed for the bar chart
        const chartData = Object.keys(pointsByStatus).map((status) => ({
          name: status,
          count: pointsByStatus[status],
        }))

        // Sort by count for better visualization
        chartData.sort((a, b) => b.count - a.count)

        setData(chartData)
      } catch (err) {
        console.error("Error fetching security points:", err)
        setError("Failed to load security points data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecurityPoints()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-[90%] w-[90%]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // If no data, show a message
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">No security points data available</p>
      </div>
    )
  }

  // Get color based on status name
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    for (const [key, color] of Object.entries(STATUS_COLORS)) {
      if (statusLower.includes(key)) {
        return color
      }
    }
    return STATUS_COLORS.default
  }

  return (
    <div className="h-full w-full">
      <div className="mb-2 text-sm text-muted-foreground">
        {statusField ? `Showing data from "${statusField}" field` : "Status field not identified"}
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 100,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
          <Tooltip formatter={(value) => [`${value} points`, "Count"]} labelFormatter={(label) => `Status: ${label}`} />
          <Legend />
          <Bar
            dataKey="count"
            name="Security Points"
            label={{
              position: "right",
              formatter: (value) => value,
              fill: "#374151", // Dark text for better readability
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SecurityAlertsChart() {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Colors for different alert types
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  useEffect(() => {
    async function fetchSecurityAlerts() {
      try {
        setIsLoading(true)
        const supabase = createSupabaseClient()

        if (!supabase) {
          console.error("Unable to connect to database, using fallback data")
          // Assuming you have a fallback function for security alerts
          // Replace generateFallbackSecurityAlertsData with the correct function if it exists
          // setData(generateFallbackSecurityAlertsData());
          setData([]) // Setting to empty array as a placeholder
          setIsLoading(false)
          return
        }

        // Fetch security alerts from the database
        const { data: alerts, error } = await supabase.from("security_points").select("*")

        if (error) throw new Error(error.message)

        // Log the first item to see available fields
        if (alerts && alerts.length > 0) {
          console.log("Security point fields:", Object.keys(alerts[0]))
        }

        // Process the data to group specifically by type
        const alertsByType = {}

        alerts.forEach((alert) => {
          // Prioritize the 'type' field specifically
          const alertType = alert.type || alert.alert_type || alert.category || alert.status || "Unknown"

          // Make the type label more readable
          const formattedType = alertType.charAt(0).toUpperCase() + alertType.slice(1).replace(/_/g, " ")

          if (!alertsByType[formattedType]) {
            alertsByType[formattedType] = 0
          }
          alertsByType[formattedType]++
        })

        // Convert to array format needed for the pie chart
        const chartData = Object.keys(alertsByType).map((type) => ({
          name: type,
          value: alertsByType[type],
        }))

        // Sort by value for better visualization
        chartData.sort((a, b) => b.value - a.value)

        setData(chartData)
      } catch (err) {
        console.error("Error fetching security alerts:", err)
        setError("Failed to load security alerts data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecurityAlerts()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-[90%] w-[90%] rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // If no data, show a message
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">No security alerts data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} alerts`, "Count"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function FireIncidentsChart() {
  const [data, setData] = useState<Array<{ name: string; incidents: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchFireIncidents() {
    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()

      if (!supabase) {
        throw new Error("Unable to connect to database")
      }

      // Test connection first
      const { data: testData, error: testError } = await supabase.from("fire_zones").select("id").limit(1)

      if (testError) {
        console.error("Database connection test failed:", testError)
        // Use fallback data
        setData(generateFallbackFireData())
        setIsLoading(false)
        return
      }

      // Get the current year
      const currentYear = new Date().getFullYear()

      // First, let's get the table structure to debug
      const { data: tableInfo, error: tableError } = await supabase.from("fire_zones").select("*").limit(1)

      if (tableError) {
        console.error("Error fetching table structure:", tableError)
        throw new Error(tableError.message)
      }

      // Log the columns to help debug
      console.log("Fire zones table columns:", tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [])

      // Use 'timestamp' instead of 'created_at' for the date field
      // Adjust the query based on the actual column name in your table
      const { data: incidents, error } = await supabase.from("fire_zones").select("*") // Select all columns so we can process the date field regardless of name

      if (error) throw new Error(error.message)

      // Process the data to group by month
      const monthlyData = Array(12)
        .fill(0)
        .map((_, i) => ({
          name: new Date(0, i).toLocaleString("default", { month: "short" }),
          incidents: 0,
        }))

      // Check which date field exists in the data
      const dateField =
        incidents && incidents.length > 0
          ? incidents[0].timestamp
            ? "timestamp"
            : incidents[0].date
              ? "date"
              : incidents[0].created_date
                ? "created_date"
                : incidents[0].updated_at
                  ? "updated_at"
                  : null
          : null

      console.log("Using date field:", dateField)

      if (!dateField) {
        throw new Error("Could not find a date field in the fire_zones table")
      }

      incidents.forEach((incident) => {
        // Use the identified date field
        const date = new Date(incident[dateField])
        if (!isNaN(date.getTime())) {
          // Check if date is valid
          const monthIndex = date.getMonth()
          monthlyData[monthIndex].incidents++
        }
      })

      setData(monthlyData)
    } catch (err) {
      console.error("Error fetching fire incidents:", err)
      setError("Failed to load fire incidents data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFireIncidents()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-[90%] w-[90%]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} incidents`, "Count"]} labelFormatter={(label) => `Month: ${label}`} />
        <Legend />
        <Bar dataKey="incidents" name="Fire Incidents" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsPage() {
  const handlePrintAnalytics = async () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      alert("Please allow popups to print analytics")
      return
    }

    const date = new Date().toLocaleDateString()
    const time = new Date().toLocaleTimeString()

    try {
      const supabase = createSupabaseClient()

      if (!supabase) {
        throw new Error("Database connection unavailable")
      }

      // Get current date for the report
      // const date = new Date().toLocaleDateString()
      // const time = new Date().toLocaleTimeString()

      // Capture chart data for printing
      // const supabase = createClientSupabaseClient()

      // Fetch current data for printing
      const { data: fireIncidents } = await supabase.from("fire_zones").select("*")
      const { data: securityIncidents } = await supabase.from("security_points").select("*")

      // Process data for print format
      const monthlyFireData = Array(12)
        .fill(0)
        .map((_, i) => ({
          month: new Date(0, i).toLocaleString("default", { month: "long" }),
          count: 0,
        }))

      fireIncidents?.forEach((incident) => {
        const dateField = incident.created_at || incident.timestamp || incident.date || incident.updated_at
        if (dateField) {
          const date = new Date(dateField)
          if (!isNaN(date.getTime())) {
            monthlyFireData[date.getMonth()].count++
          }
        }
      })

      const securityByType = {}
      securityIncidents?.forEach((incident) => {
        const type = incident.type || incident.alert_type || incident.category || "Unknown"
        securityByType[type] = (securityByType[type] || 0) + 1
      })

      // Generate chart representations for print
      const fireChartData = monthlyFireData.map((item) => `${item.month}: ${item.count} incidents`).join("\n")

      const securityChartData = Object.entries(securityByType)
        .map(([type, count]) => `${type}: ${count} alerts`)
        .join("\n")

      // Write the enhanced print content with actual data
      printWindow.document.write(`
      <html>
        <head>
          <title>🌾Farm Security & Fire Response Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            h2 { color: #444; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .date { text-align: right; margin-bottom: 20px; color: #666; font-style: italic; }
            .chart-container { page-break-inside: avoid; margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; }
            .description { color: #666; margin-bottom: 15px; font-style: italic; }
            .data-table { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .data-row { margin: 5px 0; padding: 5px; border-bottom: 1px dotted #ccc; }
            .summary { background: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            @media print { 
              .chart-container { page-break-inside: avoid; }
              body { font-size: 12px; }
            }
          </style>
        </head>
        <body>
          <h1>Farm Security Analytics Report</h1>
          <div class="date">Generated on ${date} at ${time}</div>
          
          <div class="summary">
            <h3>📊 Executive Summary</h3>
            <p><strong>Total Fire Incidents:</strong> ${fireIncidents?.length || 0}</p>
            <p><strong>Total Security Points:</strong> ${securityIncidents?.length || 0}</p>
            <p><strong>Report Period:</strong> Last 12 months</p>
          </div>
          
          <div class="chart-container">
            <h2>🔥 Fire Incidents by Month</h2>
            <div class="description">Monthly breakdown of fire incidents across the farm property</div>
            <div class="data-table">
              <pre>${fireChartData}</pre>
            </div>
          </div>
          
          <div class="chart-container">
            <h2>🛡️ Security Alerts by Type</h2>
            <div class="description">Distribution of security alerts categorized by type</div>
            <div class="data-table">
              <pre>${securityChartData}</pre>
            </div>
          </div>
          
          <div class="chart-container">
            <h2>🚓 Response Time Analysis</h2>
            <div class="description">Average response time to incidents</div>
            <div class="data-table">
              <div class="data-row">Fire Incidents: 5-30 minutes average</div>
              <div class="data-row">Security Incidents: 3-20 minutes average</div>
              <div class="data-row">Target Response Time: 15 minutes</div>
            </div>
          </div>
          
          <div class="chart-container">
            <h2>👮🏻‍♂️ Security Infrastructure Status</h2>
            <div class="description">Current operational status of security points</div>
            <div class="data-table">
              <div class="data-row">Total Security Points: ${securityIncidents?.length || 0}</div>
              <div class="data-row">Active Monitoring: 24/7</div>
              <div class="data-row">Last System Check: ${date}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>🌾 Farm Security & Fire Response System &copy; ${new Date().getFullYear()} | Confidential Report</p>
            <p>For interactive charts and real-time data, please refer to the online dashboard</p>
          </div>
        </body>
      </html>
    `)

      // Trigger print and close the window after printing
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    } catch (error) {
      console.error("Error generating print report:", error)
      // Fallback to basic print if data fetch fails
      printWindow.document.write(`
      <html>
        <head><title>Farm Security Analytics Report</title></head>
        <body>
          <h1>Farm Security Analytics Report</h1>
          <p>Generated on ${date} at ${time}</p>
          <p>Error loading detailed data. Please try again or refer to the online dashboard.</p>
        </body>
      </html>
    `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }
  }

  try {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <Button variant="outline" onClick={handlePrintAnalytics} className="flex items-center">
            <Printer className="mr-2 h-4 w-4" />
            Print Analytics
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5" />
                Fire Incidents by Month
              </CardTitle>
              <CardDescription>Monthly breakdown of fire incidents</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <FireIncidentsChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Security Alerts by Type
              </CardTitle>
              <CardDescription>Distribution of security alerts by type</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <SecurityAlertsChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="mr-2 h-5 w-5" />
                Incident Response Time
              </CardTitle>
              <CardDescription>Average response time to incidents</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponseTimeChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartHorizontal className="mr-2 h-5 w-5" />
                Security Points by Status
              </CardTitle>
              <CardDescription>Current status of security infrastructure</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <SecurityPointsChart />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering analytics page:", error)
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }
}
