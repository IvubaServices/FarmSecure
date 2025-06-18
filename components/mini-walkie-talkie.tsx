"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Radio } from "lucide-react"
import Link from "next/link"

export function MiniWalkieTalkie() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-64 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                <span className="font-medium">Quick Comms</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ×
              </Button>
            </div>

            <Button className="w-full bg-green-500 hover:bg-green-600">
              <Mic className="mr-2 h-4 w-4" />
              Push to Talk
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/communication">Open Full Walkie Talkie</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-green-500 hover:bg-green-600"
          onClick={() => setIsOpen(true)}
        >
          <Radio className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
