import { useGetUserGMs } from "@/api"
import { Card, VStack, Heading, Text, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { GMNftCard } from "./GMNftCard"

export const ProfileGMLevel = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGMs = [], isLoading: isUserGMsLoading } = useGetUserGMs(address)

  return (
    <VStack gap="4" align="stretch">
      <Card.Root variant="baseWithBorder">
        <Card.Header p="1.25rem" pb="0">
          <Heading fontSize="1.25rem">{t("Galaxy Member")}</Heading>
        </Card.Header>

        <Card.Body>
          <Skeleton loading={isUserGMsLoading}>
            {userGMs.length === 0 ? (
              <Text>{t("No GM NFTs found.")}</Text>
            ) : (
              <VStack gap="4" align="stretch">
                {userGMs.map(gm => (
                  <GMNftCard key={gm.tokenId} gm={gm} isClickable={account?.address === address} />
                ))}
              </VStack>
            )}
          </Skeleton>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
