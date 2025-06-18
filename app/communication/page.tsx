"use client"

import { WalkieTalkie } from "@/components/walkie-talkie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Users, Signal, Volume2 } from "lucide-react"

export default function CommunicationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Center</h1>
          <p className="text-muted-foreground">Real-time voice communication for your farm security team</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Walkie Talkie System
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Walkie Talkie Interface */}
        <div className="lg:col-span-2">
          <WalkieTalkie />
        </div>

        {/* Information Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Guide
              </CardTitle>
              <CardDescription>How to use the walkie talkie system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Signal className="h-4 w-4" />
                  Push to Talk
                </h4>
                <p className="text-sm text-muted-foreground">
                  Hold the green button or press the spacebar to transmit. Release to stop.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Channels
                </h4>
                <p className="text-sm text-muted-foreground">
                  Select different channels for team coordination. Create channels for specific purposes.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Control
                </h4>
                <p className="text-sm text-muted-foreground">
                  Adjust volume and mute settings. Audio is automatically managed during transmissions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audio Permission</span>
                  <Badge variant="secondary">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Sync</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
