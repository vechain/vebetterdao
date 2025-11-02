import { VStack } from "@chakra-ui/react"

import { DelegationSection } from "../ProfileGovernance/components/DelegationSection"
import { ProfileLinkedAcounts } from "../ProfileLinkedAcounts/ProfileLinkedAcounts"
import { useRetrieveProfilIdentity } from "../utils/useRetrieveProfilIdentity"

type Props = {
  address: string
}

export const ProfileSettings = ({ address }: Props) => {
  const { isConnectedUser } = useRetrieveProfilIdentity()

  return (
    <VStack gap="8" align="stretch">
      <DelegationSection address={address} isConnectedUser={isConnectedUser} />
      <ProfileLinkedAcounts address={address} />
    </VStack>
  )
}

