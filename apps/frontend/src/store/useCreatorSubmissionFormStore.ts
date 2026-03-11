import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

import { SubmitCreatorFormData } from "../components/SubmitCreatorForm/SubmitCreatorForm"

export interface CreatorSubmissionFormStoreState extends SubmitCreatorFormData {
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
        adminName: "",
        adminEmail: "",
        projectUrl: "",
        githubUsername: "",
        distributionStrategy: "",
        testnetProjectUrl: "",
        testnetAppId: "",
        securityApiSecurityMeasures: false,
        securityActionVerification: false,
        securityDeviceFingerprint: false,
        securitySecureKeyManagement: false,
        securityAntiFarming: false,
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
            distributionStrategy: "",
            testnetProjectUrl: "",
            testnetAppId: "",
            securityApiSecurityMeasures: false,
            securityActionVerification: false,
            securityDeviceFingerprint: false,
            securitySecureKeyManagement: false,
            securityAntiFarming: false,
          }),
      }),
      {
        name: "CREATOR_SUBMISSION_FORM_STORE",
      },
    ),
  ),
)
