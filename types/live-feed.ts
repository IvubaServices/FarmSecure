export interface LiveFeedSetting {
  id: string // uuid
  created_at: string // timestamptz
  updated_at: string // timestamptz
  title: string
  stream_url: string
  display_order: number
  is_enabled: boolean
}

// For form data, excluding auto-generated fields
export type LiveFeedSettingFormData = Omit<LiveFeedSetting, "id" | "created_at" | "updated_at">

// For creating, ID is not present
export type CreateLiveFeedSettingData = LiveFeedSettingFormData

// For updating, we might send partial data or the full set
export type UpdateLiveFeedSettingData = Partial<LiveFeedSettingFormData>
