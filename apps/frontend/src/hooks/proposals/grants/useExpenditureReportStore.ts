import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

type ExpenditureReportStoreState = {
  // Map of proposalId -> IPFS CID of the latest cumulative expenditure report
  reportCids: Record<string, string>
  setReportCid: (proposalId: string, cid: string) => void
  getReportCid: (proposalId: string) => string | undefined
}

/**
 * Persistent store tracking expenditure report IPFS CIDs per grant.
 * This allows the UI to know which grants have submitted reports
 * without requiring on-chain storage.
 */
export const useExpenditureReportStore = create<ExpenditureReportStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        reportCids: {},
        setReportCid: (proposalId: string, cid: string) =>
          set(state => ({
            reportCids: { ...state.reportCids, [proposalId]: cid },
          })),
        getReportCid: (proposalId: string) => get().reportCids[proposalId],
      }),
      {
        name: "EXPENDITURE_REPORT_STORE",
      },
    ),
  ),
)
