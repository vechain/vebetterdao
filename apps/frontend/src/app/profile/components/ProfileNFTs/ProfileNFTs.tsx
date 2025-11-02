import { VStack } from "@chakra-ui/react"

import { ProfileGMLevel } from "../ProfileGMLevel/ProfileGMLevel"
import { ProfileNodes } from "../ProfileNodes/ProfileNodes"

type Props = {
  address: string
}

export const ProfileNFTs = ({ address }: Props) => {
  return (
    <VStack gap="4" align="stretch">
      <ProfileGMLevel address={address} />
      <ProfileNodes address={address} />
    </VStack>
  )
}
