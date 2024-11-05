import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type CreatorSubmissionFormStoreState = {
  appName: string
  appDescription: string
  adminWalletAddress: string
  adminEmail: string
  projectUrl: string
  githubUsername: string
  twitterUsername: string
  setData: (data: Partial<CreatorSubmissionFormStoreState>) => void
  clearData: () => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useCreatorSubmissionFormStore = create<CreatorSubmissionFormStoreState>()(
  devtools(
    persist(
      set => ({
        appName: "",
        appDescription: "",
        adminWalletAddress: "",
        adminEmail: "",
        projectUrl: "",
        githubUsername: "",
        twitterUsername: "",
        setData: (data: Partial<CreatorSubmissionFormStoreState>) =>
          set(state => ({
            ...state,
            ...data,
          })),
        clearData: () =>
          set({
            appName: "",
            appDescription: "",
            adminWalletAddress: "",
            adminEmail: "",
            projectUrl: "",
            githubUsername: "",
            twitterUsername: "",
          }),
      }),
      {
        name: "CREATOR_SUBMISSION_FORM_STORE",
      },
    ),
  ),
)
