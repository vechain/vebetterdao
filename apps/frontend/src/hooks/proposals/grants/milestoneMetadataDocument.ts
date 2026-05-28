import type { ExpenditureReport, GrantFormData } from "./types"

export const MILESTONE_METADATA_SCHEMA_VERSION = 2 as const

export type GrantMilestoneChainMetadataV2 = {
  schemaVersion: typeof MILESTONE_METADATA_SCHEMA_VERSION
  milestones: GrantFormData["milestones"]
  expenditureReports: ExpenditureReport[]
}

export function parseMilestoneMetadataDocument(
  raw: unknown,
  fallbackMilestones: GrantFormData["milestones"],
): { milestones: GrantFormData["milestones"]; expenditureReports: ExpenditureReport[] } {
  if (raw === undefined || raw === null) {
    return { milestones: fallbackMilestones, expenditureReports: [] }
  }
  if (Array.isArray(raw)) {
    return { milestones: raw as GrantFormData["milestones"], expenditureReports: [] }
  }
  if (typeof raw === "object" && raw !== null && "milestones" in raw) {
    const obj = raw as { milestones: unknown; expenditureReports?: unknown }
    if (Array.isArray(obj.milestones)) {
      return {
        milestones: obj.milestones as GrantFormData["milestones"],
        expenditureReports: Array.isArray(obj.expenditureReports)
          ? (obj.expenditureReports as ExpenditureReport[])
          : [],
      }
    }
  }
  return { milestones: fallbackMilestones, expenditureReports: [] }
}

export function mergeExpenditureReport(
  doc: { milestones: GrantFormData["milestones"]; expenditureReports: ExpenditureReport[] },
  report: ExpenditureReport,
): GrantMilestoneChainMetadataV2 {
  const others = doc.expenditureReports.filter(r => r.trancheNumber !== report.trancheNumber)
  return {
    schemaVersion: MILESTONE_METADATA_SCHEMA_VERSION,
    milestones: doc.milestones,
    expenditureReports: [...others, report],
  }
}

export function buildMilestoneChainMetadata(
  milestones: GrantFormData["milestones"],
  expenditureReports: ExpenditureReport[],
): GrantMilestoneChainMetadataV2 {
  return {
    schemaVersion: MILESTONE_METADATA_SCHEMA_VERSION,
    milestones,
    expenditureReports,
  }
}
