import { useWallet } from "@vechain/vechain-kit"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { useProposalFormStore } from "../../../../../store/useProposalFormStore"
import { useMetProposalCriteria } from "../../../../../api/contracts/governance/hooks/useMetProposalCriteria"

/**
 * This hook is used to guard the proposal page.
 * It checks if the user has the required data to access the page.
 * If the user does not have the required data, it redirects the user to the beginning of the form.
 */
export const useNewProposalPageGuard = () => {
  const pathname = usePathname()
  const { account } = useWallet()
  const { hasMetProposalCriteria } = useMetProposalCriteria()
  const { title, shortDescription, markdownDescription, actions, votingStartRoundId, depositAmount } =
    useProposalFormStore()
  const isVisitAuthorized = useMemo(() => {
    if (!account?.address || !hasMetProposalCriteria) return false
    switch (pathname) {
      case "/proposals/new/form/functions/details":
        return !!actions.length
      case "/proposals/new/form/round":
        return !!title && !!shortDescription && !!markdownDescription
      case "/proposals/new/form/support":
        return !!title && !!shortDescription && !!markdownDescription
      case "/proposals/new/form/preview-and-publish":
        return (
          !!title && !!shortDescription && !!markdownDescription && !!votingStartRoundId && depositAmount !== undefined
        )
      default:
        return true
    }
  }, [
    title,
    shortDescription,
    markdownDescription,
    account?.address,
    pathname,
    actions,
    votingStartRoundId,
    depositAmount,
    hasMetProposalCriteria,
  ])
  const redirectPath = useMemo(() => {
    if (!account?.address || !hasMetProposalCriteria) return "/proposals"
    return "/proposals/new"
  }, [account?.address, hasMetProposalCriteria])

  return { isVisitAuthorized, redirectPath }
}
