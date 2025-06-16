import { AllApps } from "@/api"
import dayjs from "@/utils/dayjsConfig"

export function sortByCreationDate(apps: AllApps[]): AllApps[] {
  return [...apps].sort((a, b) => dayjs(b.createdAtTimestamp).diff(dayjs(a.createdAtTimestamp)))
}

export function sortAlphabetically(apps: AllApps[]): AllApps[] {
  return [...apps].sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByRewards<T extends { id: string }>(apps: T[], rewardsMap?: Map<string, number>): T[] {
  if (!rewardsMap || rewardsMap.size === 0) {
    return [...apps]
  }
  return [...apps].sort((a, b) => (rewardsMap.get(b.id) || 0) - (rewardsMap.get(a.id) || 0))
}
