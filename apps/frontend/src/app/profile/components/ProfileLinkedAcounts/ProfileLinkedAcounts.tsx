import { useAccountLinking } from "@/api"
import { NoLinkedAccount } from "./components/NoLinkedAccount"
import { PendingLinkingProposal } from "./components/PendingLinkingProposal"
import { LinkedAccounts } from "./components/LinkedAccounts"
import { VStack } from "@chakra-ui/react"

export const ProfileLinkedAcounts = () => {
  const { isLoading } = useAccountLinking()
  if (isLoading) return null
  return (
    <VStack align="stretch" gap={6}>
      <PendingLinkingProposal />
      <NoLinkedAccount />
      <LinkedAccounts />
    </VStack>
  )
}
