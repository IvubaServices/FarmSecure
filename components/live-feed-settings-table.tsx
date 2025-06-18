"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LiveFeedSettingsForm } from "./live-feed-settings-form"
import type { LiveFeedSetting } from "@/types/live-feed"
import { deleteLiveFeedSetting } from "@/lib/actions/live-feed-actions"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, PlusCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LiveFeedSettingsTableProps {
  settings: LiveFeedSetting[]
}

export function LiveFeedSettingsTable({ settings }: LiveFeedSettingsTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<LiveFeedSetting | null>(null)
  const { toast } = useToast()

  const handleAddNew = () => {
    setEditingSetting(null)
    setIsFormOpen(true)
  }

  const handleEdit = (setting: LiveFeedSetting) => {
    setEditingSetting(setting)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteLiveFeedSetting(id)
      toast({
        title: "Setting Deleted",
        description: `Live feed setting "${title}" has been deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error Deleting Setting",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false)
    setEditingSetting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Feed Setting
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSetting ? "Edit" : "Add New"} Live Feed Setting</DialogTitle>
            <DialogDescription>
              {editingSetting ? "Update the details for this live feed." : "Enter the details for the new live feed."}
            </DialogDescription>
          </DialogHeader>
          <LiveFeedSettingsForm initialData={editingSetting} onFormSubmit={handleFormSubmit} />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Stream URL</TableHead>
              <TableHead className="text-center">Order</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No live feed settings loaded. You can add new feed settings using the button above.
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">{setting.title}</TableCell>
                  <TableCell className="max-w-xs truncate" title={setting.stream_url}>
                    {setting.stream_url}
                  </TableCell>
                  <TableCell className="text-center">{setting.display_order}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={setting.is_enabled ? "default" : "outline"}>
                      {setting.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(setting)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the live feed setting for "
                            {setting.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(setting.id, setting.title)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
