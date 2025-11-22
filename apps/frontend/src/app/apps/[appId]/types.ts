import { XAppStatus } from "@/types/appDetails"

// Server-side data shapes for app detail page
export interface AppInfo {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: string
  appAvailableForAllocationVoting: boolean
}

export interface AppMetadata {
  logo?: string
  banner?: string
  description?: string
  screenshots?: string[]
}

export interface EndorsementStatusData {
  score: string
  threshold: string
  isUnendorsed: boolean
  isBlacklisted: boolean
  isEligible: boolean
  status: XAppStatus
}

export interface AppDetailServerData {
  appInfo: AppInfo
  metadata: AppMetadata
  endorsementData: EndorsementStatusData
}
