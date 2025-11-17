import { Card, VStack, Heading, Text, Skeleton } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useGetUserGMs } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"

import { ProfileGMCard } from "./ProfileGMCard"

export const ProfileGMLevel = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGMs = [], isLoading: isUserGMsLoading } = useGetUserGMs(address)
  return (
    <VStack gap="4" align="stretch">
      <Card.Root variant="primary">
        <Card.Header>
          <Heading size="xl">{t("Galaxy Member")}</Heading>
        </Card.Header>
        <Card.Body>
          <Skeleton loading={isUserGMsLoading}>
            {userGMs.length === 0 ? (
              <Text>{t("No GM NFTs found.")}</Text>
            ) : (
              <VStack gap="4" align="stretch">
                {userGMs.map(gm => (
                  <ProfileGMCard key={gm.tokenId} gm={gm} isClickable={account?.address === address} />
                ))}
              </VStack>
            )}
          </Skeleton>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
