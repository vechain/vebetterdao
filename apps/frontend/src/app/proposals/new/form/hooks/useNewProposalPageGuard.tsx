import { useProposalFormStore } from "@/store/useProposalFormStore"
import { useWallet } from "@vechain/dapp-kit-react"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

/**
 * This hook is used to guard the proposal page.
 * It checks if the user has the required data to access the page.
 * If the user does not have the required data, it redirects the user to the beginning of the form.
 */
export const useNewProposalPageGuard = () => {
  const pathname = usePathname()
  const { account } = useWallet()
  const { title, shortDescription, markdownDescription, actions, votingStartRoundId, depositAmount } =
    useProposalFormStore()

  const isVisitAuthorized = useMemo(() => {
    if (!account) return false
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
  }, [title, shortDescription, markdownDescription, account, pathname, actions, votingStartRoundId, depositAmount])

  const redirectPath = useMemo(() => {
    if (!account) return "/proposals"
    return "/proposals/new"
  }, [account])

  return { isVisitAuthorized, redirectPath }
}
