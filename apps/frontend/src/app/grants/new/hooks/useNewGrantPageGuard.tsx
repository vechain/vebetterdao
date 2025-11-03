import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAccountPermissions } from "@/api/contracts/account/hooks/useAccountPermissions"

import { useMetProposalCriteria } from "../../../../api/contracts/governance/hooks/useMetProposalCriteria"

/**
 * This hook is used to guard the grants page.
 * It checks if the user has the required data to access the page.
 * If the user does not have the required data, it redirects the user to the grants page.
 */
export const useNewGrantPageGuard = () => {
  const { account } = useWallet()
  const { hasMetProposalCriteria, isLoading } = useMetProposalCriteria()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
  const isProduction = process.env.NODE_ENV === "production"

  const hasAllowedWallet = useMemo(
    () => (isProduction && permissions?.isGrantApprover) || !isProduction,
    [isProduction, permissions?.isGrantApprover],
  )

  const isVisitAuthorized = useMemo(() => {
    if (isLoading) return true // Allow visit while loading
    if (!account?.address || !hasMetProposalCriteria || !hasAllowedWallet) return false
    return true
  }, [account?.address, hasMetProposalCriteria, isLoading, hasAllowedWallet])

  const redirectPath = useMemo(() => {
    if (!account?.address || !hasMetProposalCriteria || !hasAllowedWallet) return "/grants"
    return "/grants/new"
  }, [account?.address, hasAllowedWallet, hasMetProposalCriteria])

  return { isVisitAuthorized, redirectPath, isLoading }
}
