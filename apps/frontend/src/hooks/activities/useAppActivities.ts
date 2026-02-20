import { ActivityItem } from "./types"

export const useAppActivities = (): { data: ActivityItem[]; isLoading: boolean } => {
  return { data: [], isLoading: false }
}
