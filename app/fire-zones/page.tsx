"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Flame, PlusCircle, Printer } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { useEffect } from "react"
import { Loading } from "@/components/loading"
// Add fallback loading component
const FallbackLoading = ({ message }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

function getSeverityBadge(severity) {
  const variants = {
    Critical: "destructive",
    High: "destructive",
    Medium: "warning",
    Low: "outline",
  }

  return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>
}

function getStatusBadge(status) {
  const variants = {
    Active: "destructive",
    Contained: "warning",
    Extinguished: "outline",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

export default function FireZonesPage() {
  const { fireZones, isLoading } = useRealtime()

  // Add error handling for missing assets
  useEffect(() => {
    // Preload any critical assets and handle failures gracefully
    const handleAssetError = (event) => {
      console.warn("Asset failed to load:", event.target?.src || event.target?.href)
    }

    // Add global error handler for failed asset loads
    window.addEventListener("error", handleAssetError, true)

    return () => {
      window.removeEventListener("error", handleAssetError, true)
    }
  }, [])

  const handlePrintFireZones = () => {
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      alert("Please allow popups to print fire incidents")
      return
    }

    const currentDate = new Date().toLocaleString()

    // Count incidents by status
    const activeCount = fireZones.filter((zone) => zone.status === "Active").length
    const containedCount = fireZones.filter((zone) => zone.status === "Contained").length
    const extinguishedCount = fireZones.filter((zone) => zone.status === "Extinguished").length

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🔥Fire Incidents Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .critical, .active { background-color: #ffdddd; color: #d32f2f; font-weight: bold; }
          .high { background-color: #ffeeee; color: #f44336; }
          .medium, .contained { background-color: #fff8e1; color: #ff9800; }
          .low, .extinguished { background-color: #f5f5f5; color: #757575; }
          .summary { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔥Fire Incidents Report</h1>
          <div>Generated: ${currentDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${
              fireZones.length > 0
                ? fireZones
                    .map(
                      (zone) => `
                <tr>
                  <td>${zone.name}</td>
                  <td class="${zone.severity.toLowerCase()}">${zone.severity}</td>
                  <td class="${zone.status.toLowerCase()}">${zone.status}</td>
                  <td>${new Date(zone.reported_at).toLocaleDateString()}</td>
                  <td>${zone.latitude.toFixed(4)}, ${zone.longitude.toFixed(4)}</td>
                </tr>
              `,
                    )
                    .join("")
                : `<tr><td colspan="5" style="text-align: center">No fire zones found</td></tr>`
            }
          </tbody>
        </table>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Incidents: ${fireZones.length}</p>
          <p>Active: ${activeCount} | Contained: ${containedCount} | Extinguished: ${extinguishedCount}</p>
        </div>
        
        <div class="footer">
          <p>🌾Farm Security & Fire Response - Fire Management System</p>
          <p>Confidential - For internal use only</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  if (isLoading) {
    try {
      return <Loading message="Loading fire zones..." />
    } catch (error) {
      return <FallbackLoading message="Loading fire zones..." />
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6" onError={(e) => console.warn("Component error:", e)}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Fire Zones</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintFireZones}>
            <Printer className="mr-2 h-4 w-4" />
            Print Incidents
          </Button>
          <Button onClick={() => (window.location.href = "/fire-zones/add")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Fire Zone
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="mr-2 h-5 w-5 text-red-500" />
            Fire Incidents
          </CardTitle>
          <CardDescription>Manage and monitor fire incidents across the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fireZones.length > 0 ? (
                fireZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>{getSeverityBadge(zone.severity)}</TableCell>
                    <TableCell>{getStatusBadge(zone.status)}</TableCell>
                    <TableCell>{new Date(zone.reported_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = `/fire-zones/${zone.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No fire zones found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
