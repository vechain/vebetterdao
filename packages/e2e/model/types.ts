// A users allocation vote
export type AllocationVote = {
  appName: AppName
  votePercentage: number
}

export type Currency = "VOT3" | "B3TR"
export type RoundStatus = "Active now" | "Concluded"
export type RoundIndex = number | "latest"
export type SectionName = "Dashboard" | "Apps" | "Allocations" | "Governance" | "Admin"

export type AppName =
  | "Mugshot"
  | "Cleanify"
  | "GreenCart"
  | "Green Ambassador Challenge"
  | "Oily"
  | "Vyvo"
  | "Non Fungible Book Club (NFBC)"
