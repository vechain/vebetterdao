import { useAccountLinking } from "@/api"
import { NoLinkedAccount } from "./components/NoLinkedAccount"
import { PendingLinkingProposal } from "./components/PendingLinkingProposal"
import { LinkedAccounts } from "./components/LinkedAccounts"
import { VStack } from "@chakra-ui/react"

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
