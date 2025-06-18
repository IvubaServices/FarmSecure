"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, PlusCircle, Printer } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { Loading } from "@/components/loading"
import Link from "next/link"

function getStatusBadge(status) {
  const variants = {
    Alert: "destructive",
    Active: "success",
    Inactive: "outline",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

function getTypeBadge(type) {
  const variants = {
    Checkpoint: "default",
    Camera: "secondary",
    Sensor: "outline",
    Guard: "default",
  }

  return <Badge variant={variants[type] || "outline"}>{type}</Badge>
}

export default function SecurityPointsPage() {
  const { securityPoints, isLoading } = useRealtime()

  const handlePrintSecurityPoints = () => {
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      alert("Please allow popups to print security incidents")
      return
    }

    const currentDate = new Date().toLocaleString()

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>👮🏻‍♂️Security Incidents Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #1a365d;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .date {
            color: #718096;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f7fafc;
            font-weight: bold;
          }
          .status-alert {
            color: white;
            background-color: #e53e3e;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-active {
            color: white;
            background-color: #38a169;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-inactive {
            color: #4a5568;
            background-color: #edf2f7;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .type-badge {
            background-color: #4299e1;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .type-camera {
            background-color: #805ad5;
          }
          .type-sensor {
            background-color: #718096;
          }
          .type-guard {
            background-color: #3182ce;
          }
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f7fafc;
            border-radius: 8px;
          }
          .summary h2 {
            margin-top: 0;
            color: #2d3748;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👮🏻‍♂️Security Incidents Report</h1>
          <div class="date">Generated on: ${currentDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${
              securityPoints.length > 0
                ? securityPoints
                    .map(
                      (point) => `
                <tr>
                  <td>${point.name}</td>
                  <td>
                    <span class="type-badge ${
                      point.type.toLowerCase() === "camera"
                        ? "type-camera"
                        : point.type.toLowerCase() === "sensor"
                          ? "type-sensor"
                          : point.type.toLowerCase() === "guard"
                            ? "type-guard"
                            : ""
                    }">
                      ${point.type}
                    </span>
                  </td>
                  <td>
                    <span class="${
                      point.status === "Alert"
                        ? "status-alert"
                        : point.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                    }">
                      ${point.status}
                    </span>
                  </td>
                  <td>${new Date(point.created_at).toLocaleDateString()}</td>
                  <td>${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</td>
                </tr>
              `,
                    )
                    .join("")
                : '<tr><td colspan="5" style="text-align: center">No security points found</td></tr>'
            }
          </tbody>
        </table>
        
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Security Points:</strong> ${securityPoints.length}</p>
          <p><strong>Alert Status:</strong> ${securityPoints.filter((p) => p.status === "Alert").length}</p>
          <p><strong>Active Status:</strong> ${securityPoints.filter((p) => p.status === "Active").length}</p>
          <p><strong>Inactive Status:</strong> ${securityPoints.filter((p) => p.status === "Inactive").length}</p>
          <p><strong>Types:</strong> 
            Checkpoints: ${securityPoints.filter((p) => p.type === "Checkpoint").length}, 
            Cameras: ${securityPoints.filter((p) => p.type === "Camera").length}, 
            Sensors: ${securityPoints.filter((p) => p.type === "Sensor").length}, 
            Guards: ${securityPoints.filter((p) => p.type === "Guard").length}
          </p>
        </div>
        
        <div class="footer">
          <p>CONFIDENTIAL - FOR INTERNAL USE ONLY</p>
          <p>🌾Farm Security & Fire Response System &copy; ${new Date().getFullYear()}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
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
    return <Loading message="Loading security points..." />
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Security Points</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintSecurityPoints}>
            <Printer className="mr-2 h-4 w-4" />
            Print Incidents
          </Button>
          <Link href="/security-points/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Security Point
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-blue-500" />
            Security Infrastructure
          </CardTitle>
          <CardDescription>Manage and monitor security points across the farm</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityPoints.length > 0 ? (
                securityPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell className="font-medium">{point.name}</TableCell>
                    <TableCell>{getTypeBadge(point.type)}</TableCell>
                    <TableCell>{getStatusBadge(point.status)}</TableCell>
                    <TableCell>{new Date(point.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = `/security-points/${point.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No security points found
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
