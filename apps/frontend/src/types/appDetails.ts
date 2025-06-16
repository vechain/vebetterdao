export enum XAppsCreationSteps {
  SUBMISSION,
  ENDORSEMENT,
  ALLOCATION,
}
export enum XAppsCreationStepStatus {
  COMPLETED = "COMPLETED",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
}

export enum XAppStatus {
  BLACKLISTED = "BLACKLISTED",
  LOOKING_FOR_ENDORSEMENT = "LOOKING_FOR_ENDORSEMENT", // New app, needs endorsement score above threshold
  // ENDORSED_NOT_ELIGIBLE = "ENDORSED_NOT_ELIGIBLE", // Endorsement score above threshold, eligible from next round - Status doesn't exist in current implementation
  ENDORSED_AND_ELIGIBLE = "ENDORSED_AND_ELIGIBLE",
  UNENDORSED_AND_ELIGIBLE = "UNENDORSED_AND_ELIGIBLE", // Endorsement score below threshold, still eligible for the next 2 rounds (grace period)
  UNENDORSED_NOT_ELIGIBLE = "UNENDORSED_NOT_ELIGIBLE", // Endorsement score below threshold, not eligible (endorsement lost)
  UNKNOWN = "UNKNOWN",
}

export const APP_CATEGORIES = [
  { id: "carbon-footprint", name: "Carbon Footprint", color: "#feeab6" },
  { id: "education-learning", name: "Education & Learning", color: "#E5E9F0" },
  { id: "fitness-wellness", name: "Fitness & Wellness", color: "#D1E2FF" },
  { id: "green-finance-defi", name: "Green Finance, DeFi", color: "##ffe0cd" },
  { id: "green-mobility-travel", name: "Green Travel", color: "#FAD1FC" },
  { id: "nutrition", name: "Nutrition", color: "#CEF5D1" },
  { id: "plastic-waste-recycling", name: "Plastic Waste & Recycling", color: "#FFD4E0" },
  { id: "renewable-energy-efficiency", name: "Renewable Energy", color: "#E0DAFD" },
  { id: "social-community-activism", name: "Social, Community, Activism", color: "#c2f4f0" },
  { id: "sustainable-shopping", name: "Sustainable Shopping", color: "#C4ECFF" },
]

// SORTING
export type SortOption = "newest" | "rewards" | "alphabetical" | "default"
export interface SortOptionProps {
  id: SortOption
  label: string
  description: string
}
// Sort options configuration
export const sortOptions: SortOptionProps[] = [
  {
    id: "alphabetical",
    label: "Alphabetical",
    description: "A to Z by app name",
  },
  {
    id: "newest",
    label: "Newest",
    description: "Most recently created apps",
  },
  {
    id: "rewards",
    label: "Rewards",
    description: "Highest rewards distributed",
  },
]

// FILTERING
export const FILTER_ACTIVE_APPS = "Active apps"
export const FILTER_NEW_APPS = "New apps"
export const FILTER_GRACE_PERIOD = "In grace period"
export const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

export const MAX_CATEGORIES = 2
