"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Users, MoreHorizontal, UserPlus, Edit, Trash } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { UserAddDialog } from "@/components/user-add-dialog"
import { UserEditDialog } from "@/components/user-edit-dialog"
import { Loading } from "@/components/loading"

// Define user types and roles
export type UserRole = "admin" | "manager" | "responder" | "viewer"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  team?: string
  created_at: string
  last_sign_in?: string
  status: "active" | "inactive" | "pending"
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const supabase = createClientSupabaseClient()

        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to load users. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle user actions
  const handleAddUser = async (newUser: Omit<User, "id" | "created_at">) => {
    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("users").insert([newUser]).select()

      if (error) throw error

      if (data && data.length > 0) {
        setUsers([data[0], ...users])
      }

      setAddDialogOpen(false)
    } catch (err) {
      console.error("Error adding user:", err)
      // You could add toast notification here
    }
  }

  const handleEditUser = async (updatedUser: User) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("users")
        .update({
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          team: updatedUser.team,
          status: updatedUser.status,
        })
        .eq("id", updatedUser.id)

      if (error) throw error

      setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
      setEditDialogOpen(false)
      setSelectedUser(null)
    } catch (err) {
      console.error("Error updating user:", err)
      // You could add toast notification here
    }
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        const supabase = createClientSupabaseClient()

        const { error } = await supabase.from("users").delete().eq("id", selectedUser.id)

        if (error) throw error

        setUsers(users.filter((user) => user.id !== selectedUser.id))
        setDeleteDialogOpen(false)
        setSelectedUser(null)
      } catch (err) {
        console.error("Error deleting user:", err)
        // You could add toast notification here
      }
    }
  }

  // Role badge color mapping
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "responder":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  // Status badge color mapping
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "destructive"
      case "pending":
        return "warning"
      default:
        return "outline"
    }
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.team || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No users found. Add your first user to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <UserAddDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAddUser={handleAddUser} />

      {/* Edit User Dialog */}
      {selectedUser && (
        <UserEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onUpdateUser={handleEditUser}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <span className="font-semibold">{selectedUser?.full_name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
