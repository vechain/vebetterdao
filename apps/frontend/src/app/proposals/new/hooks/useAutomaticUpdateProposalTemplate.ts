import {
  ADDRESS_PLACEHOLDER,
  DATE_PLACEHOLDER,
  GovernanceProposalTemplate,
  ONCHAIN_ACTION_PLACEHOLDER,
  SUMMARY_PLACEHOLDER,
  TEXT_ONLY_PLACEHOLDER,
  TITLE_PLACEHOLDER,
} from "@/constants"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { useWallet } from "@vechain/dapp-kit-react"
import dayjs from "dayjs"
import { useEffect } from "react"

/**
 * Automatically updates the proposal template with the latest data from the form
 */
export const useAutomaticUpdateProposalTemplate = () => {
  const { account } = useWallet()
  const { actions, title, shortDescription, setData } = useProposalFormStore()

  useEffect(() => {
    let updatedMarkdown = GovernanceProposalTemplate

    updatedMarkdown = updatedMarkdown.replace(ONCHAIN_ACTION_PLACEHOLDER, actions.length ? "X" : " ")
    updatedMarkdown = updatedMarkdown.replace(TEXT_ONLY_PLACEHOLDER, actions.length ? " " : "X")
    if (account) {
      updatedMarkdown = updatedMarkdown.replace(ADDRESS_PLACEHOLDER, account)
    }
    if (title) updatedMarkdown = updatedMarkdown.replace(TITLE_PLACEHOLDER, title)
    if (shortDescription) updatedMarkdown = updatedMarkdown.replace(SUMMARY_PLACEHOLDER, shortDescription)

    updatedMarkdown = updatedMarkdown.replace(DATE_PLACEHOLDER, dayjs().format("MMMM D, YYYY"))

    setData({ markdownDescription: updatedMarkdown })
  }, [title, shortDescription, setData, actions, account])
}
