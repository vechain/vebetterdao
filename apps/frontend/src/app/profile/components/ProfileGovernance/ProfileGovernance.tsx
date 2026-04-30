import { VStack } from "@chakra-ui/react"

import { NavigatorGovernanceActivity } from "@/app/navigators/[address]/components/NavigatorGovernanceActivity"

import { useRetrieveProfilIdentity } from "../utils/useRetrieveProfilIdentity"

import { CurrentDelegation } from "./components/delegation/CurrentDelegation/CurrentDelegation"
import { PendingDelegationDelegateePOV } from "./components/delegation/PendingDelegationDelegateePOV/PendingDelegationDelegateePOV"
import { VotingQualification } from "./components/delegation/VotingQualification/VotingQualification"

type Props = {
  address: string
}

export const ProfileGovernance = ({ address }: Props) => {
  const { isConnectedUser } = useRetrieveProfilIdentity()

  return (
    <VStack gap="8" w="full">
      <PendingDelegationDelegateePOV address={address} isConnectedUser={isConnectedUser} />
      <CurrentDelegation address={address} isConnectedUser={isConnectedUser} />
      <VotingQualification address={address} isConnectedUser={isConnectedUser} />
      <NavigatorGovernanceActivity address={address} />
    </VStack>
  )
}
