"use client"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Map, Flame, Shield, Settings, Users, BarChart, Radio, Video } from "lucide-react"
import Link from "next/link"

const sidebarItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Map View", href: "/map", icon: Map },
  { name: "Team", href: "/team", icon: Users },
  { name: "Fire Zones", href: "/fire-zones", icon: Flame },
  { name: "Security Points", href: "/security-points", icon: Shield },
  { name: "Communication", href: "/communication", icon: Radio },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Live Feeds", href: "/live-feeds", icon: Video },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-background md:block md:w-64">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("justify-start", isActive && "bg-secondary font-medium")}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
