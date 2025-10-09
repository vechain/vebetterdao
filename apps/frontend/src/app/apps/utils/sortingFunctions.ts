import { AllApps } from "../../../api/contracts/xApps/getXApps"

import dayjs from "@/utils/dayjsConfig"

export function sortByCreationDate(apps: AllApps[]): AllApps[] {
  return [...apps].sort((a, b) => dayjs(b.createdAtTimestamp).diff(dayjs(a.createdAtTimestamp)))
}
export function sortAlphabetically(apps: AllApps[]): AllApps[] {
  return [...apps].sort((a, b) => a.name.localeCompare(b.name))
}
export function sortByRewards<T extends AllApps>(appsWithStatus: T[], positionsMap: Map<string, number>): T[] {
  return appsWithStatus.sort((a, b) => {
    const posA = positionsMap.get(a.id) ?? 0
    const posB = positionsMap.get(b.id) ?? 0
    return posA - posB
  })
}
