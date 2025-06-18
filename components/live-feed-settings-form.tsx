"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { LiveFeedSetting } from "@/types/live-feed"
import { createLiveFeedSetting, updateLiveFeedSetting } from "@/lib/actions/live-feed-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react" // Import useMemo

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stream_url: z.string().url("Invalid URL format. Must be a full URL (e.g., https://...)."),
  display_order: z.coerce.number().int().min(0, "Display order must be a non-negative integer"),
  is_enabled: z.boolean(),
})

type LiveFeedSettingsFormValues = z.infer<typeof formSchema>

interface LiveFeedSettingsFormProps {
  initialData?: LiveFeedSetting | null
  onFormSubmit?: () => void
}

export function LiveFeedSettingsForm({ initialData, onFormSubmit }: LiveFeedSettingsFormProps) {
  const { toast } = useToast()
  const router = useRouter()

  // Memoize defaultValues so it only changes when initialData changes
  const defaultValues = useMemo<Partial<LiveFeedSettingsFormValues>>(() => {
    return initialData
      ? {
          title: initialData.title,
          stream_url: initialData.stream_url,
          display_order: initialData.display_order,
          is_enabled: initialData.is_enabled,
        }
      : {
          title: "",
          stream_url: "",
          display_order: 0,
          is_enabled: true,
        }
  }, [initialData])

  const form = useForm<LiveFeedSettingsFormValues>({
    resolver: zodResolver(formSchema),
    // defaultValues can be passed directly here, useForm handles it internally.
    // The key is that the `defaultValues` object itself should be stable if initialData hasn't changed.
    defaultValues,
  })

  // This useEffect is to reset the form if initialData changes *after* the form has been initialized.
  // For example, if the dialog is kept open and the user selects a different item to edit.
  useEffect(() => {
    // form.reset will update the form values to the new defaultValues
    // This is useful if initialData changes while the form is already mounted.
    form.reset(defaultValues)
  }, [initialData, defaultValues, form]) // form.reset is stable, defaultValues is memoized

  async function onSubmit(data: LiveFeedSettingsFormValues) {
    try {
      let result
      if (initialData?.id) {
        result = await updateLiveFeedSetting(initialData.id, data)
      } else {
        result = await createLiveFeedSetting(data)
      }

      if (result.success) {
        toast({
          title: initialData?.id ? "Setting Updated" : "Setting Created",
          description: `Live feed setting "${data.title}" has been ${initialData?.id ? "updated" : "created"}.`,
        })
        if (onFormSubmit) onFormSubmit()
        router.refresh()
      } else {
        if (result.errors) {
          result.errors.forEach((err) => {
            if (err.path && err.path.length > 0) {
              form.setError(err.path[0] as keyof LiveFeedSettingsFormValues, { message: err.message })
            } else {
              toast({ title: "Error", description: err.message, variant: "destructive" })
            }
          })
        } else {
          toast({ title: "Error", description: "An unknown error occurred.", variant: "destructive" })
        }
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Front Gate Cam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stream_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stream URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/stream.m3u8" {...field} />
              </FormControl>
              <FormDescription>The HLS (.m3u8) URL for the live stream.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormDescription>Lower numbers appear first. Default is 0.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enable Feed</FormLabel>
                <FormDescription>If disabled, this feed will not be shown on the live feeds page.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? initialData?.id
              ? "Saving..."
              : "Creating..."
            : initialData?.id
              ? "Save Changes"
              : "Create Setting"}
        </Button>
      </form>
    </Form>
  )
}
