import { SubmitCreatorFormData } from "@/components/SubmitCreatorForm"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export interface CreatorSubmissionFormStoreState extends SubmitCreatorFormData {
  setData: (data: Partial<CreatorSubmissionFormStoreState>) => void
  clearData: () => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useCreatorSubmissionFormStore = create<Partial<CreatorSubmissionFormStoreState>>()(
  devtools(
    persist(
      set => ({
        appName: "",
        appDescription: "",
        adminWalletAddress: "",
        adminName: "",
        adminEmail: "",
        projectUrl: "",
        githubUsername: "",
        twitterUsername: "",
        distributionStrategy: "",
        testnetProjectUrl: "",
        testnetAppId: "",
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
            adminName: "",
            adminEmail: "",
            projectUrl: "",
            githubUsername: "",
            twitterUsername: "",
            distributionStrategy: "",
            testnetProjectUrl: "",
            testnetAppId: "",
          }),
      }),
      {
        name: "CREATOR_SUBMISSION_FORM_STORE",
      },
    ),
  ),
)
