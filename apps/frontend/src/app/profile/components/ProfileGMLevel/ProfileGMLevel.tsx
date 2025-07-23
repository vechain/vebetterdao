import { useGetUserGMs } from "@/api"
import { Card, VStack, CardBody, CardHeader, Heading, Text, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { GMNftCard } from "./GMNftCard"

export const ProfileGMLevel = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGMs = [], isLoading: isUserGMsLoading } = useGetUserGMs(address)

  return (
    <VStack gap="4" align="stretch">
      <Card variant="baseWithBorder">
        <CardHeader p="1.25rem" pb="0">
          <Heading fontSize="1.25rem">{t("Galaxy Member")}</Heading>
        </CardHeader>

        <CardBody>
          <Skeleton isLoaded={!isUserGMsLoading}>
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
        </CardBody>
      </Card>
    </VStack>
  )
}
