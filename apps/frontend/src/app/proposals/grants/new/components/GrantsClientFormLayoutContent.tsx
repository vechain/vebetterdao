"use client"
import { useLayoutEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@vechain/vechain-kit"
import { useMetProposalCriteria } from "@/api/contracts/governance"

type Props = {
  children: React.ReactNode
}
export const GrantsClientFormLayoutContent = ({ children }: Readonly<Props>) => {
  const router = useRouter()
  const { account } = useWallet()
  const hasMetProposalCriteria = useMetProposalCriteria()

  const isVisitAuthorized = useMemo(() => {
    if (!account?.address || !hasMetProposalCriteria) return false
    return true
  }, [account?.address, hasMetProposalCriteria])

  //   redirect the user to the beginning of the form if the required data is missing
  //   this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!isVisitAuthorized) {
      router.push("/proposals/grants")
    }
  }, [isVisitAuthorized, router])

  if (!isVisitAuthorized) return null

  return children
}
