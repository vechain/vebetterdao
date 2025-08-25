import { type GrantFormData } from "@/hooks/proposals/grants/types"

/**
 * Check if the form has any meaningful changes from initial state
 */
export const hasGrantFormChanges = (formData: GrantFormData): boolean => {
  // if it does not exist any field
  const nonEmpty = (s?: string) => !!(s && s.trim().length > 0)

  const hasBasicInfo = [
    formData.grantType,
    formData.applicantName,
    formData.applicantSurname,
    formData.projectName,
    formData.problemDescription,
    formData.solutionDescription,
  ].some(nonEmpty)

  const hasOptionalInfo = [
    formData.applicantRole,
    formData.applicantProfileUrl,
    formData.applicantCountry,
    formData.applicantCity,
    formData.applicantStreet,
    formData.applicantPostalCode,
    formData.applicantBackground,
    formData.proposerAddress,
    formData.companyName,
    formData.appTestnetUrl,
    formData.projectWebsite,
    formData.githubUsername,
    formData.twitterUsername,
    formData.discordUsername,
    formData.targetUsers,
    formData.competitiveEdge,
    formData.benefitsToUsers,
    formData.benefitsToDApps,
    formData.benefitsToVeChainEcosystem,
    formData.x2EModel,
    formData.revenueModel,
    formData.highLevelRoadmap,
  ].some(nonEmpty)

  const hasMilestoneChanges = Array.isArray(formData.milestones)
    ? formData.milestones.some(m => nonEmpty(m?.description) || (Number(m?.fundingAmount) || 0) > 0)
    : false

  return hasBasicInfo || hasOptionalInfo || hasMilestoneChanges
}

/**
 * Draft item interface for localStorage
 */
export interface DraftItem<T = any> {
  id: string
  data: T
  title: string
  grantType: string
  createdAt: number
  updatedAt: number
}

/**
 * Get localStorage key based on grant type
 */
export const getGrantDraftStorageKey = (grantType: string): string => {
  const type = grantType?.toLowerCase()

  switch (type) {
    case "dapp":
      return "DRAFT_GRANT_DAPP_PROPOSALS"
    case "tooling":
      return "DRAFT_GRANT_INFRA_PROPOSALS"
    default:
      return "DRAFT_GRANT_PROPOSALS"
  }
}

/**
 * Get all drafts for a specific grant type
 */
export const getDraftsByType = (grantType: string): DraftItem<GrantFormData>[] => {
  if (typeof window === "undefined") return []

  try {
    const storageKey = getGrantDraftStorageKey(grantType)
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading drafts from localStorage:", error)
    return []
  }
}

/**
 * Get all drafts across all grant types
 */
export const getAllGrantDrafts = (): DraftItem<GrantFormData>[] => {
  if (typeof window === "undefined") return []

  const dappDrafts = getDraftsByType("dapp")
  const infraDrafts = getDraftsByType("tooling")
  const otherDrafts = getDraftsByType("other")

  return [...dappDrafts, ...infraDrafts, ...otherDrafts]
}

/**
 * Delete a specific draft by ID and type
 */
export const deleteDraftById = (draftId: string, grantType: string): void => {
  if (typeof window === "undefined") return

  try {
    const storageKey = getGrantDraftStorageKey(grantType)
    const drafts = getDraftsByType(grantType)
    const filteredDrafts = drafts.filter(draft => draft.id !== draftId)
    localStorage.setItem(storageKey, JSON.stringify(filteredDrafts))
  } catch (error) {
    console.error("Error deleting draft:", error)
  }
}

/**
 * Load a specific draft by ID
 */
export const loadDraftById = (draftId: string): DraftItem<GrantFormData> | null => {
  const allDrafts = getAllGrantDrafts()
  return allDrafts.find(draft => draft.id === draftId) || null
}

/**
 * Clear all drafts for a specific grant type
 */
export const clearDraftsByType = (grantType: string): void => {
  if (typeof window === "undefined") return

  try {
    const storageKey = getGrantDraftStorageKey(grantType)
    localStorage.removeItem(storageKey)
  } catch (error) {
    console.error("Error clearing drafts:", error)
  }
}

/**
 * Generate unique hash based on the grant type, grantee name and surname, project name and description
 */
export const generateDraftId = (data: GrantFormData): string => {
  const keyFields = {
    grantType: data.grantType,
    applicantName: data.applicantName,
    applicantSurname: data.applicantSurname,
    projectName: data.projectName,
    problemDescription: data.problemDescription,
  }

  const str = JSON.stringify(keyFields)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return `${data.grantType || "unknown"}_${Math.abs(hash)}_${Date.now()}`
}
