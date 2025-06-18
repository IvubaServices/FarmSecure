import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    fireZonesCount: number
    securityPointsCount: number
    activeFireZones: any[]
    alertSecurityPoints: any[]
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const activeFireCount = stats.activeFireZones.length
  const alertSecurityCount = stats.alertSecurityPoints.length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fire Zones</CardTitle>
          <Flame className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.fireZonesCount}</div>
          <p className="text-xs text-muted-foreground">{activeFireCount} active incidents</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Security Points</CardTitle>
          <Shield className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.securityPointsCount}</div>
          <p className="text-xs text-muted-foreground">{alertSecurityCount} in alert status</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Fires</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeFireCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.fireZonesCount - activeFireCount} contained/extinguished
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.securityPointsCount - alertSecurityCount} OK</div>
          <p className="text-xs text-muted-foreground">{alertSecurityCount} points need attention</p>
        </CardContent>
      </Card>
    </div>
  )
}
