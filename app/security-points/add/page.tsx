import { SecurityPointForm } from "@/components/security-point-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AddSecurityPointPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/security-points">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Security Points
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Security Point</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-blue-500" />
            New Security Point
          </CardTitle>
          <CardDescription>
            Add a new security checkpoint, camera, sensor, or guard station to monitor your farm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecurityPointForm />
        </CardContent>
      </Card>
    </div>
  )
}
