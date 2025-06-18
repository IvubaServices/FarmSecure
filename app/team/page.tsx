"use client"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Shield,
  Flame,
  MapPin,
  Edit,
  Loader2,
  Send,
  Phone,
  Printer,
  UserPlus,
  UserMinus,
  Trash2,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRealtime } from "@/contexts/realtime-context"
import { Loading } from "@/components/loading"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the TeamMember type
type TeamMember = {
  id: number
  name: string
  role: string
  email: string
  phone: string
  avatar: string | null
  status: string
  responsibility: string | null
  team: string
  created_at?: string
  updated_at?: string
}

// Define call links for different teams and scenarios
const CALL_LINKS = {
  teams: {
    Fire: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Fire team call link
    Security: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Security team call link (using the same link for now)
    Management: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Management team call link (using the same link for now)
  },
  scenarios: {
    emergency: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Emergency scenario call
    routine: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Routine check-in call
    training: "https://wa.me/call/JeyNQ1m660WEGKsIOJ3caG", // Training call
  },
}

function getRoleIcon(role: string) {
  if (role.includes("Security")) return <Shield className="h-4 w-4 text-blue-500" />
  if (role.includes("Fire")) return <Flame className="h-4 w-4 text-red-500" />
  if (role.includes("Field")) return <MapPin className="h-4 w-4 text-green-500" />
  return null
}

function getStatusBadge(status: string) {
  const variants = {
    Active: "success",
    "On Leave": "warning",
    "On Call": "secondary",
    Inactive: "outline",
  }

  // Add custom styling for Active status
  if (status === "Active") {
    return (
      <Badge
        variant={variants[status] || "outline"}
        className="bg-green-500 hover:bg-green-600 text-black border-green-500"
      >
        {status}
      </Badge>
    )
  }

  // Add custom styling for On Leave status
  if (status === "On Leave") {
    return (
      <Badge
        variant={variants[status] || "outline"}
        className="bg-orange-500 hover:bg-orange-600 text-black border-orange-500"
      >
        {status}
      </Badge>
    )
  }

  // Add custom styling for Inactive status
  if (status === "Inactive") {
    return (
      <Badge
        variant={variants[status] || "outline"}
        className="bg-blue-800 hover:bg-blue-900 text-white border-blue-800"
      >
        {status}
      </Badge>
    )
  }

  // Add custom styling for On Call status
  if (status === "On Call") {
    return (
      <Badge
        variant={variants[status] || "outline"}
        className="bg-green-800 hover:bg-green-900 text-white border-green-800"
      >
        {status}
      </Badge>
    )
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

function getTeamBadge(team: string) {
  const variants = {
    Fire: "destructive",
    Security: "default",
    Management: "outline",
  }

  return <Badge variant={variants[team] || "outline"}>{team}</Badge>
}

export default function TeamPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="container mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Unable to load team data. Please ensure you're logged in and have the necessary permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">The team data could not be loaded. This might be because:</p>
                <ul className="list-disc pl-6 mb-6 text-muted-foreground">
                  <li>You're not connected to the realtime service</li>
                  <li>You don't have permission to view team data</li>
                  <li>There was a temporary service disruption</li>
                </ul>
                <Button onClick={() => window.location.reload()}>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TeamContent />
    </ErrorBoundary>
  )
}

// Move the main component content to this function
function TeamContent() {
  const [selectedTeam, setSelectedTeam] = useState("All")
  const { teamMembers, fireZones, securityPoints, isLoading, updateTeamMemberStatus } = useRealtime()
  const { toast } = useToast()

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    responsibility: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // State for WhatsApp message
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<TeamMember | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [customMessage, setCustomMessage] = useState<string>("")

  // State for WhatsApp call
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callRecipient, setCallRecipient] = useState<TeamMember | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>("emergency")

  // State for add/delete member dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newMemberData, setNewMemberData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    responsibility: "",
    team: "Security",
    status: "Inactive",
    avatar: "/FarmLogo.png",
  })
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter team members based on selected team
  const filteredTeamMembers =
    selectedTeam === "All" ? teamMembers : teamMembers.filter((member) => member.team === selectedTeam)

  // Get the most recent active fire zone for WhatsApp message
  const activeFireZones = fireZones.filter((zone) => zone.status === "Active")
  const activeSecurityPoints = securityPoints.filter((point) => point.status === "Alert")

  // Combine fire zones and security points for deployment areas
  const deploymentAreas = [
    ...activeFireZones.map((zone) => ({
      id: `fire-${zone.id}`,
      name: zone.name,
      type: "fire",
      severity: zone.severity,
      status: zone.status,
      latitude: zone.latitude,
      longitude: zone.longitude,
    })),
    ...securityPoints.map((point) => ({
      id: `security-${point.id}`,
      name: point.name,
      type: "security",
      status: point.status,
      latitude: point.latitude,
      longitude: point.longitude,
    })),
  ]

  // Replace the existing createWhatsAppMessage function with this updated version:
  const createWhatsAppMessage = (member: TeamMember, areaId: string, customMsg: string) => {
    // Start with greeting and put ALERT directly underneath
    let message = `Hi ${member.name},\n\nALERT: You are being deployed to fire zone\n\n`

    // Add custom message if provided
    if (customMsg) {
      message += `${customMsg}\n\n`
    }

    // Add area-specific information
    if (areaId) {
      const selectedDeploymentArea = deploymentAreas.find((area) => area.id === areaId)

      if (selectedDeploymentArea) {
        if (selectedDeploymentArea.type === "fire") {
          message += `Location: "${selectedDeploymentArea.name}"\n`
          message += `Severity: ${selectedDeploymentArea.severity}\n`
          message += `Status: ${selectedDeploymentArea.status}\n`
          const lat = selectedDeploymentArea.latitude.toFixed(6)
          const lng = selectedDeploymentArea.longitude.toFixed(6)
          message += `Coordinates: ${lat}, ${lng}\n`
          message += `Map: https://www.google.com/maps?q=${lat},${lng}\n\n`
        } else {
          message += `Location: "${selectedDeploymentArea.name}"\n`
          message += `Status: ${selectedDeploymentArea.status}\n`
          const lat = selectedDeploymentArea.latitude.toFixed(6)
          const lng = selectedDeploymentArea.longitude.toFixed(6)
          message += `Coordinates: ${lat}, ${lng}\n`
          message += `Map: https://www.google.com/maps?q=${lat},${lng}\n\n`
        }
      }
    } else if (activeFireZones.length > 0) {
      const zone = activeFireZones[0]
      message += `Location: ${zone.name}\n`
      message += `Severity: ${zone.severity}\n`
      const lat = zone.latitude.toFixed(6)
      const lng = zone.longitude.toFixed(6)
      message += `Coordinates: ${lat}, ${lng}\n`
      message += `Map: https://www.google.com/maps?q=${lat},${lng}\n\n`
    } else {
      message += `General deployment. Please acknowledge receipt.\n\n`
    }

    // Add link to update position
    const baseUrl = window.location.origin
    message += `Update your position here: ${baseUrl}/my-location?member=${member.id}`

    return encodeURIComponent(message)
  }

  const handleStatusChange = async (member: TeamMember, newStatus: string) => {
    try {
      await updateTeamMemberStatus(member.id, newStatus)
      toast({
        title: "Status Updated",
        description: `${member.name}'s status has been updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Failed to update status:", error)
      toast({
        title: "Error",
        description: "Failed to update team member status",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateMember = async (e) => {
    e.preventDefault()
    if (!selectedMember) return

    setIsUpdating(true)
    try {
      const supabase = createClientSupabaseClient()

      // Handle avatar if a preview URL was selected
      let avatarUrl = selectedMember.avatar

      if (previewUrl) {
        avatarUrl = previewUrl
      }

      // Update the team member record
      const { error } = await supabase
        .from("team_members")
        .update({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          responsibility: formData.responsibility,
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMember.id)

      if (error) throw error

      toast({
        title: "Member Updated",
        description: `${formData.name}'s details have been updated successfully.`,
      })

      // Close the dialog by setting selectedMember to null
      setSelectedMember(null)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error("Failed to update team member:", error)
      toast({
        title: "Error",
        description: "Failed to update team member details: " + (error.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setIsUploading(false)
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      responsibility: member.responsibility || "",
    })
    setPreviewUrl(null)
    setSelectedFile(null)
  }

  const openWhatsAppDialog = (member: TeamMember) => {
    setMessageRecipient(member)
    setSelectedArea("")
    setCustomMessage("")
    setWhatsappDialogOpen(true)
  }

  const openCallDialog = (member: TeamMember) => {
    setCallRecipient(member)
    setSelectedScenario("emergency") // Default to emergency scenario
    setCallDialogOpen(true)
  }

  const sendWhatsAppMessage = () => {
    if (!messageRecipient) return

    const message = createWhatsAppMessage(messageRecipient, selectedArea, customMessage)
    const whatsappUrl = `https://wa.me/${messageRecipient.phone.replace(/\+/g, "")}?text=${message}`

    window.open(whatsappUrl, "_blank")
    setWhatsappDialogOpen(false)

    toast({
      title: "WhatsApp Message",
      description: `Message prepared for ${messageRecipient.name}`,
    })
  }

  const initiateWhatsAppCall = () => {
    if (!callRecipient) return

    // Determine which call link to use based on team and scenario
    let callLink: string

    if (selectedScenario === "team") {
      // Use team-specific call link
      callLink = CALL_LINKS.teams[callRecipient.team] || CALL_LINKS.teams.Management
    } else {
      // Use scenario-specific call link
      callLink = CALL_LINKS.scenarios[selectedScenario] || CALL_LINKS.scenarios.emergency
    }

    window.open(callLink, "_blank")
    setCallDialogOpen(false)

    toast({
      title: "WhatsApp Group Call",
      description: `Adding ${callRecipient.name} to the ${selectedScenario === "team" ? callRecipient.team : selectedScenario} WhatsApp call.`,
    })
  }

  const sendWalkieTalkieLink = (member: TeamMember) => {
    if (!member || !member.phone) return

    // Create the base URL for the walkie-talkie page
    const baseUrl = window.location.origin
    const walkieTalkieUrl = `${baseUrl}/communication`

    // Create the message with instructions
    const message = `Hi ${member.name},\n\nUse this link to join our walkie-talkie communication system:\n\n${walkieTalkieUrl}\n\nOpen this link on your device to communicate with the team in real-time.`

    // Create the WhatsApp URL with the encoded message
    const whatsappUrl = `https://wa.me/${member.phone.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")

    toast({
      title: "Link Sent",
      description: `Walkie-talkie link sent to ${member.name}`,
    })
  }

  const handlePrintTeamList = () => {
    // Create a print-friendly version
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      const teamTitle = selectedTeam === "All" ? "All Teams" : `${selectedTeam} Team`

      // Generate HTML content for printing
      printWindow.document.write(`
        <html>
          <head>
            <title>🌾Farm Security & Fire Response - ${teamTitle} List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .team-member { 
                border: 1px solid #ddd; 
                padding: 15px; 
                margin-bottom: 15px; 
                page-break-inside: avoid;
              }
              .name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .role { color: #555; margin-bottom: 10px; }
              .details { margin-top: 10px; }
              .label { font-weight: bold; }
              .status { 
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-right: 8px;
              }
              .status-Active { background-color: #22c55e; color: black; }
              .status-OnLeave { background-color: #f97316; color: black; }
              .status-OnCall { background-color: #166534; color: white; }
              .status-Inactive { background-color: #1e40af; color: white; }
              .team { 
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
              }
              .team-Fire { background-color: #ef4444; color: white; }
              .team-Security { background-color: #3b82f6; color: white; }
              .team-Management { background-color: #6b7280; color: white; }
              .print-date { text-align: right; font-size: 12px; color: #666; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>Farm Security & Fire Response</h1>
            <h1>👨🏻‍👩🏻‍👦🏻‍👦🏻 ${teamTitle} List</h1>
            <div>
              ${filteredTeamMembers
                .map(
                  (member) => `
                <div class="team-member">
                  <div class="name">${member.name}</div>
                  <div class="role">${member.role}</div>
                  <div>
                    <span class="status status-${member.status.replace(" ", "")}">${member.status}</span>
                    <span class="team team-${member.team}">${member.team}</span>
                  </div>
                  <div class="details">
                    <p><span class="label">Email:</span> ${member.email}</p>
                    <p><span class="label">Phone:</span> ${member.phone}</p>
                    <p><span class="label">Responsibility:</span> ${member.responsibility || "Not specified"}</p>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
          </body>
        </html>
      `)

      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } else {
      // Fallback if popup is blocked
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your popup blocker settings.",
        variant: "destructive",
      })
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()

    setIsUpdating(true)
    try {
      const supabase = createClientSupabaseClient()

      // Insert the new team member
      const { data, error } = await supabase
        .from("team_members")
        .insert({
          name: newMemberData.name,
          role: newMemberData.role,
          email: newMemberData.email,
          phone: newMemberData.phone,
          responsibility: newMemberData.responsibility,
          team: newMemberData.team,
          status: newMemberData.status,
          avatar: newMemberData.avatar,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      toast({
        title: "Member Added",
        description: `${newMemberData.name} has been added successfully.`,
      })

      // Reset form and close dialog
      setNewMemberData({
        name: "",
        role: "",
        email: "",
        phone: "",
        responsibility: "",
        team: "Security",
        status: "Inactive",
        avatar: "/FarmLogo.png",
      })
      setAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add team member:", error)
      toast({
        title: "Error",
        description: "Failed to add team member: " + (error.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClientSupabaseClient()

      // Find the member name for the toast message
      const memberName = teamMembers.find((m) => m.id === memberToDelete)?.name || "Team member"

      // Delete the team member
      const { error } = await supabase.from("team_members").delete().eq("id", memberToDelete)

      if (error) throw error

      toast({
        title: "Member Deleted",
        description: `${memberName} has been removed successfully.`,
      })

      // Reset and close dialog
      setMemberToDelete(null)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete team member:", error)
      toast({
        title: "Error",
        description: "Failed to delete team member: " + (error.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleNewMemberInputChange = (e) => {
    const { name, value } = e.target
    setNewMemberData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (isLoading) {
    return <Loading message="Loading team members..." />
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
            <UserMinus className="mr-2 h-4 w-4" />
            Delete Member
          </Button>
          <Button variant="outline" onClick={handlePrintTeamList}>
            <Printer className="mr-2 h-4 w-4" />
            Print Team List
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={selectedTeam === "All" ? "default" : "outline"} onClick={() => setSelectedTeam("All")}>
          <Users className="mr-2 h-4 w-4" />
          All Teams
        </Button>
        <Button variant={selectedTeam === "Fire" ? "default" : "outline"} onClick={() => setSelectedTeam("Fire")}>
          <Flame className="mr-2 h-4 w-4" />
          Fire Team
        </Button>
        <Button
          variant={selectedTeam === "Security" ? "default" : "outline"}
          onClick={() => setSelectedTeam("Security")}
        >
          <Shield className="mr-2 h-4 w-4" />
          Security Team
        </Button>
        <Button
          variant={selectedTeam === "Management" ? "default" : "outline"}
          onClick={() => setSelectedTeam("Management")}
        >
          <Users className="mr-2 h-4 w-4" />
          Management
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {selectedTeam === "Fire" ? (
              <Flame className="mr-2 h-5 w-5 text-red-500" />
            ) : selectedTeam === "Security" ? (
              <Shield className="mr-2 h-5 w-5 text-blue-500" />
            ) : (
              <Users className="mr-2 h-5 w-5" />
            )}
            {selectedTeam === "All" ? "Farm Security & Response Team" : `${selectedTeam} Team`}
          </CardTitle>
          <CardDescription>
            {selectedTeam === "Fire"
              ? "Team members responsible for fire response and emergency management"
              : selectedTeam === "Security"
                ? "Team members responsible for farm security and surveillance"
                : selectedTeam === "Management"
                  ? "Team members responsible for overall management and coordination"
                  : "Team members responsible for farm security and fire response"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTeamMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeamMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col items-center p-6 pb-4">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={member.avatar || "/FarmLogo.png"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold">{member.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(member.role)}
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]" title={member.role}>
                          {member.role}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              {getStatusBadge(member.status)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member, "Active")}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant="success"
                                className="mr-2 bg-green-500 hover:bg-green-600 text-black border-green-500"
                              >
                                Active
                              </Badge>
                              Available for duty
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member, "On Call")}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant="secondary"
                                className="mr-2 bg-green-800 hover:bg-green-900 text-white border-green-800"
                              >
                                On Call
                              </Badge>
                              Available remotely
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member, "On Leave")}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant="warning"
                                className="mr-2 bg-orange-500 hover:bg-orange-600 text-black border-orange-500"
                              >
                                On Leave
                              </Badge>
                              Temporarily unavailable
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member, "Inactive")}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant="outline"
                                className="mr-2 bg-blue-800 hover:bg-blue-900 text-white border-blue-800"
                              >
                                Inactive
                              </Badge>
                              Not on duty
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {getTeamBadge(member.team)}
                      </div>
                    </div>
                    <div className="bg-muted p-4">
                      <p className="text-sm mb-2">
                        <span className="font-medium">Email:</span> {member.email}
                      </p>
                      <p className="text-sm mb-3">
                        <span className="font-medium">Responsibility:</span> {member.responsibility || "Not specified"}
                      </p>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm">
                          <span className="font-medium">Phone:</span> {member.phone}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openWhatsAppDialog(member)}
                          >
                            <Send className="h-4 w-4" />
                            Deploy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => sendWalkieTalkieLink(member)}
                          >
                            <Radio className="h-4 w-4" />
                            Two-Way Radio
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No team members found for the selected team.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update the details for this team member. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="responsibility" className="text-right">
                  Responsibility
                </Label>
                <Textarea
                  id="responsibility"
                  name="responsibility"
                  value={formData.responsibility}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">
                  Avatar
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={previewUrl || selectedMember?.avatar || "/placeholder.svg"}
                        alt={formData.name}
                      />
                      <AvatarFallback>
                        {formData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <select
                          id="avatar"
                          name="avatar"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={(e) => {
                            const selectedAvatar = e.target.value
                            setPreviewUrl(selectedAvatar)
                            setSelectedFile(null)
                          }}
                          value={previewUrl || selectedMember?.avatar || ""}
                        >
                          <option value="">Select an avatar</option>
                          <optgroup label="Default">
                            <option value="/FarmLogo.png">Default Logo</option>
                          </optgroup>
                          <optgroup label="Team Specific">
                            <option value="/firefighter-cartoon.png">Fire Fighter</option>
                            <option value="/farmmedic.png">Medic</option>
                            <option value="/security-robot.png">Security</option>
                          </optgroup>
                          <optgroup label="Abstract">
                            <option value="/abstract-geometric-shapes.png">Abstract Geometric</option>
                            <option value="/abstract-geometric-zz.png">Abstract ZZ</option>
                            <option value="/abstract-jm.png">Abstract JM</option>
                            <option value="/abstract-lm.png">Abstract LM</option>
                            <option value="/abstract-lv-pattern.png">Abstract LV</option>
                            <option value="/abstract-tm.png">Abstract TM</option>
                          </optgroup>
                          <optgroup label="Stylized">
                            <option value="/stylized-bk-logo.png">Stylized BK</option>
                            <option value="/stylized-letters-sj.png">Stylized SJ</option>
                            <option value="/stylized-sm-logo.png">Stylized SM</option>
                            <option value="/stylized-tn.png">Stylized TN</option>
                          </optgroup>
                        </select>
                        <p className="text-xs text-muted-foreground">Select an avatar from the available images</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedMember(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || isUploading}>
                {(isUpdating || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Uploading..." : isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Deployment Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deploy Team Member</DialogTitle>
            <DialogDescription>Send deployment instructions to {messageRecipient?.name} via WhatsApp</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deploymentArea">Deployment Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deployment area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Deployment</SelectItem>

                  {activeFireZones.length > 0 && (
                    <>
                      <SelectItem value="fire-header" disabled className="font-bold">
                        Active Fire Zones
                      </SelectItem>
                      {activeFireZones.map((zone) => (
                        <SelectItem key={`fire-${zone.id}`} value={`fire-${zone.id}`}>
                          🔥 {zone.name} - {zone.severity}
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {securityPoints.length > 0 && (
                    <>
                      <SelectItem value="security-header" disabled className="font-bold">
                        Security Points
                      </SelectItem>
                      {securityPoints.map((point) => (
                        <SelectItem key={`security-${point.id}`} value={`security-${point.id}`}>
                          🛡️ {point.name} - {point.status}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMessage">Additional Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add any additional instructions or information..."
                rows={3}
              />
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-2">Message Preview:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {messageRecipient &&
                  decodeURIComponent(createWhatsAppMessage(messageRecipient, selectedArea, customMessage))}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendWhatsAppMessage}>
              <Send className="mr-2 h-4 w-4" />
              Send WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Call Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>WhatsApp Call</DialogTitle>
            <DialogDescription>Select call type for {callRecipient?.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="callType">Call Type</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team Call ({callRecipient?.team})</SelectItem>
                  <SelectItem value="emergency">Emergency Call</SelectItem>
                  <SelectItem value="routine">Routine Check-in</SelectItem>
                  <SelectItem value="training">Training Call</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedScenario === "team"
                  ? `This will add ${callRecipient?.name} to the ${callRecipient?.team} team call.`
                  : selectedScenario === "emergency"
                    ? "This will add the team member to an emergency response call."
                    : selectedScenario === "routine"
                      ? "This will add the team member to a routine check-in call."
                      : "This will add the team member to a training session call."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCallDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={initiateWhatsAppCall}>
              <Phone className="mr-2 h-4 w-4" />
              Start Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Fill in the details for the new team member. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="new-name"
                  name="name"
                  value={newMemberData.name}
                  onChange={handleNewMemberInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-role" className="text-right">
                  Role
                </Label>
                <Input
                  id="new-role"
                  name="role"
                  value={newMemberData.role}
                  onChange={handleNewMemberInputChange}
                  className="col-span-3"
                  required
                  placeholder="e.g., Security Officer, Fire Chief"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="new-email"
                  name="email"
                  type="email"
                  value={newMemberData.email}
                  onChange={handleNewMemberInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="new-phone"
                  name="phone"
                  value={newMemberData.phone}
                  onChange={handleNewMemberInputChange}
                  className="col-span-3"
                  required
                  placeholder="e.g., +1234567890"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-team" className="text-right">
                  Team
                </Label>
                <Select
                  name="team"
                  value={newMemberData.team}
                  onValueChange={(value) => setNewMemberData((prev) => ({ ...prev, team: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Fire">Fire</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-status" className="text-right">
                  Status
                </Label>
                <Select
                  name="status"
                  value={newMemberData.status}
                  onValueChange={(value) => setNewMemberData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Call">On Call</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-responsibility" className="text-right">
                  Responsibility
                </Label>
                <Textarea
                  id="new-responsibility"
                  name="responsibility"
                  value={newMemberData.responsibility}
                  onChange={handleNewMemberInputChange}
                  className="col-span-3"
                  rows={3}
                  placeholder="Describe the member's responsibilities"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-avatar" className="text-right">
                  Avatar
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={newMemberData.avatar || "/FarmLogo.png"} alt="New member avatar" />
                      <AvatarFallback>
                        {newMemberData.name
                          ? newMemberData.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "NM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <select
                          id="new-avatar"
                          name="avatar"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={(e) => setNewMemberData((prev) => ({ ...prev, avatar: e.target.value }))}
                          value={newMemberData.avatar}
                        >
                          <option value="">Select an avatar</option>
                          <optgroup label="Default">
                            <option value="/FarmLogo.png">Default Logo</option>
                          </optgroup>
                          <optgroup label="Team Specific">
                            <option value="/firefighter-cartoon.png">Fire Fighter</option>
                            <option value="/farmmedic.png">Medic</option>
                            <option value="/security-robot.png">Security</option>
                          </optgroup>
                          <optgroup label="Abstract">
                            <option value="/abstract-geometric-shapes.png">Abstract Geometric</option>
                            <option value="/abstract-geometric-zz.png">Abstract ZZ</option>
                            <option value="/abstract-jm.png">Abstract JM</option>
                            <option value="/abstract-lm.png">Abstract LM</option>
                            <option value="/abstract-lv-pattern.png">Abstract LV</option>
                            <option value="/abstract-tm.png">Abstract TM</option>
                          </optgroup>
                          <optgroup label="Stylized">
                            <option value="/stylized-bk-logo.png">Stylized BK</option>
                            <option value="/stylized-letters-sj.png">Stylized SJ</option>
                            <option value="/stylized-sm-logo.png">Stylized SM</option>
                            <option value="/stylized-tn.png">Stylized TN</option>
                          </optgroup>
                        </select>
                        <p className="text-xs text-muted-foreground">Select an avatar from the available images</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdating ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>Select a team member to remove from the system.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-to-delete">Select Member</Label>
                <Select
                  value={memberToDelete?.toString() || ""}
                  onValueChange={(value) => setMemberToDelete(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member to delete" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.role} ({member.team})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {memberToDelete && (
                <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
                  <div className="flex items-center gap-3 mb-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <h4 className="font-medium text-destructive">Warning: This action cannot be undone</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You are about to permanently delete {teamMembers.find((m) => m.id === memberToDelete)?.name}. This
                    will remove all their data from the system.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={!memberToDelete || isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
