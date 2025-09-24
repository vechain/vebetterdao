import { ComponentType } from "react"

export interface VotingSegment {
  // Core data
  option: string
  voters: number
  votingPower: bigint
  totalWeight: bigint

  // Calculated percentages
  percentage: number // Based on total weight for progress bar
  percentagePower: number // Based on total voting power

  // UI props
  color: string
  icon: ComponentType
}

export interface VotingResults {
  segments: VotingSegment[]
  totals: {
    voters: number
    votingPower: bigint
    totalWeight: bigint
  }
}

export interface ProgressBarSegment {
  percentage: number
  color: string
  icon: ComponentType
  label?: string
}

export interface TableRowData {
  option: string
  voters: number
  votingPower: bigint
  percentage: number
  color: string
  icon: ComponentType
}

// Utility functions to transform data
export const votingSegmentToProgressBar = (segment: VotingSegment): ProgressBarSegment => ({
  percentage: segment.percentage,
  color: segment.color,
  icon: segment.icon,
  label: segment.option,
})

export const votingSegmentToTableRow = (segment: VotingSegment): TableRowData => ({
  option: segment.option,
  voters: segment.voters,
  votingPower: segment.votingPower,
  percentage: segment.percentage,
  color: segment.color,
  icon: segment.icon,
})
