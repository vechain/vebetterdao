import { VStack } from "@chakra-ui/react"

import { useAccountLinking } from "../../../../api/contracts/vePassport/hooks/useAccountLinking"

import { LinkedAccounts } from "./components/LinkedAccounts/LinkedAccounts"
import { NoLinkedAccount } from "./components/NoLinkedAccount/NoLinkedAccount"
import { PendingLinkingProposal } from "./components/PendingLinkingProposal/PendingLinkingProposal"

type Props = {
  address: string
}
export const ProfileLinkedAcounts = ({ address }: Props) => {
  const { isLoading } = useAccountLinking()
  if (isLoading) return null
  return (
    <VStack align="stretch" gap={6}>
      <PendingLinkingProposal address={address} />
      <NoLinkedAccount address={address} />
      <LinkedAccounts address={address} />
    </VStack>
  )
}
