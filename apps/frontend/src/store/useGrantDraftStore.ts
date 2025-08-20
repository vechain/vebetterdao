import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { getGrantDraftStorageKey, generateDraftId } from "@/utils/formUtils"
import dayjs from "dayjs"

export interface DraftMetadata {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export type GrantDraftStoreState = GrantFormData &
  DraftMetadata & {
    setData: (data: Partial<GrantFormData>) => void
    clearData: () => void
    saveDraft: () => void
    hasDraft: () => boolean
    getAllDrafts: () => { dapp: any; tooling: any }
  }

const initialFormData: GrantFormData = {
  grantType: "",
  // About applicant
  applicantName: "",
  applicantSurname: "",
  applicantRole: "",
  applicantProfileUrl: "",
  applicantCountry: "",
  applicantCity: "",
  applicantStreet: "",
  applicantPostalCode: "",
  applicantBackground: "",
  proposerAddress: "",
  // About project
  projectName: "",
  companyName: "",
  appTestnetUrl: "",
  projectWebsite: "",
  githubUsername: "",
  twitterUsername: "",
  discordUsername: "",
  // Project details
  problemDescription: "",
  solutionDescription: "",
  targetUsers: "",
  competitiveEdge: "",
  // Outcomes
  benefitsToUsers: "",
  benefitsToDApps: "",
  benefitsToVeChainEcosystem: "",
  x2EModel: "",
  revenueModel: "",
  highLevelRoadmap: "",
  // Milestones
  milestones: [
    {
      description: "",
      fundingAmount: 0,
      durationFrom: dayjs().unix(),
      durationTo: dayjs().add(1, "month").unix(),
    },
  ],
  termsOfService: false,
}

const getTitle = (data: GrantFormData): string => {
  if (data.projectName?.trim()) {
    return data.projectName.trim()
  }
  if (data.applicantName?.trim() && data.applicantSurname?.trim()) {
    return `${data.applicantName.trim()} ${data.applicantSurname.trim()}`
  }
  if (data.applicantName?.trim()) {
    return data.applicantName.trim()
  }
  return "unknown"
}

/**
 * Create a grant draft store for a specific grant type
 * Each grant type gets its own storage key and persistence
 */
export const createGrantDraftStore = (grantType: string) => {
  const storageKey = getGrantDraftStorageKey(grantType)

  return create<GrantDraftStoreState>()(
    devtools(
      persist(
        (set, get) => ({
          ...initialFormData,
          grantType,
          id: "",
          title: "",
          createdAt: 0,
          updatedAt: 0,

          setData: (data: Partial<GrantFormData>) =>
            set(state => ({
              ...state,
              ...data,
              updatedAt: Date.now(),
            })),

          clearData: () => {
            const now = Date.now()
            set({
              ...initialFormData,
              grantType,
              id: "",
              title: "",
              createdAt: now,
              updatedAt: now,
            })
          },

          saveDraft: () => {
            const state = get()
            const now = Date.now()
            const id = state.id || generateDraftId(state)
            const title = getTitle(state)

            set({
              ...state,
              id,
              title,
              createdAt: state.createdAt || now,
              updatedAt: now,
            })
          },

          hasDraft: () => {
            const state = get()
            return !!(state.applicantName || state.projectName || state.problemDescription || state.id)
          },

          getAllDrafts: () => {
            if (typeof window === "undefined") return { dapp: null, tooling: null }

            try {
              const dappData = localStorage.getItem("DRAFT_GRANT_DAPP_PROPOSALS")
              const toolingData = localStorage.getItem("DRAFT_GRANT_INFRA_PROPOSALS")

              return {
                dapp: dappData ? JSON.parse(dappData) : null,
                tooling: toolingData ? JSON.parse(toolingData) : null,
              }
            } catch (error) {
              console.error("Error reading drafts:", error)
              return { dapp: null, tooling: null }
            }
          },
        }),
        {
          name: storageKey,
        },
      ),
    ),
  )
}

// Store instances for each grant type
const storeInstances = new Map<string, ReturnType<typeof createGrantDraftStore>>()

/**
 * Initialize placeholder entries for all grant types to prevent cross-contamination
 */
const initializePlaceholderStores = () => {
  const grantTypes = ["dapp", "tooling"]

  grantTypes.forEach(type => {
    const storageKey = getGrantDraftStorageKey(type)
    const existing = localStorage.getItem(storageKey)

    if (!existing) {
      // Create a minimal placeholder entry to prevent confusion
      const placeholder = {
        state: {
          ...initialFormData,
          grantType: type,
          id: "",
          title: "",
          createdAt: 0,
          updatedAt: 0,
        },
        version: 0,
      }
      localStorage.setItem(storageKey, JSON.stringify(placeholder))
      console.log("Created placeholder for grant type:", type)
    }
  })
}

/**
 * Get or create a store instance for a specific grant type
 */
export const useGrantDraftStore = (grantType: string) => {
  // Initialize placeholders on first access
  if (typeof window !== "undefined" && storeInstances.size === 0) {
    initializePlaceholderStores()
  }

  if (!storeInstances.has(grantType)) storeInstances.set(grantType, createGrantDraftStore(grantType))
  return storeInstances.get(grantType)!()
}
