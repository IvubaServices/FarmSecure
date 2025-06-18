"use client"

import { Users } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"

export function TeamStatusWidget() {
  const { teamMembers, isLoading } = useRealtime()

  // Count team members by status
  const statusCounts = teamMembers.reduce(
    (acc, member) => {
      if (member.status === "Active") acc.active++
      else if (member.status === "On Call") acc.onCall++
      else if (member.status === "On Leave") acc.onLeave++
      else acc.inactive++
      return acc
    },
    { active: 0, onCall: 0, onLeave: 0, inactive: 0 },
  )

  // Count fire team members who are active or on call
  const availableFireTeam = teamMembers.filter(
    (member) => member.team === "Fire" && (member.status === "Active" || member.status === "On Call"),
  ).length

  const totalFireTeam = teamMembers.filter((m) => m.team === "Fire").length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <span className="font-medium">Team Status</span>
      </div>

      <div className="space-y-2">
        <div className="text-3xl font-bold">
          {availableFireTeam} / {totalFireTeam}
        </div>
        <p className="text-xs text-muted-foreground">Fire team members available</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span>{statusCounts.active} Active</span>
        </div>
        <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <span>{statusCounts.onCall} On Call</span>
        </div>
        <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span>{statusCounts.onLeave} On Leave</span>
        </div>
        <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
          <span>{statusCounts.inactive} Inactive</span>
        </div>
      </div>
    </div>
  )
}
