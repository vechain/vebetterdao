import { VStack } from "@chakra-ui/react"

import { CurrentDelegation } from "./delegation/CurrentDelegation/CurrentDelegation"
import { PendingDelegationDelegateePOV } from "./delegation/PendingDelegationDelegateePOV/PendingDelegationDelegateePOV"
import { VotingQualification } from "./delegation/VotingQualification/VotingQualification"

type Props = {
  address: string
  isConnectedUser: boolean
}

export const DelegationSection = ({ address, isConnectedUser }: Props) => {
  return (
    <VStack gap="8" w="full">
      <PendingDelegationDelegateePOV address={address} isConnectedUser={isConnectedUser} />
      <CurrentDelegation address={address} isConnectedUser={isConnectedUser} />
      <VotingQualification address={address} isConnectedUser={isConnectedUser} />
    </VStack>
  )
}
