import { Card, VStack, Heading, Skeleton, Icon } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { EmptyStateCard } from "@/components/EmptyStateCard"
import NftEarthIcon from "@/components/Icons/svg/nft-earth.svg"

import { useGetUserGMs } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useRetrieveProfilIdentity } from "../utils/useRetrieveProfilIdentity"

import { ProfileGMCard } from "./ProfileGMCard"

export const ProfileGMLevel = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const { data: userGMs = [], isLoading: isUserGMsLoading } = useGetUserGMs(address)
  const { isConnectedUser } = useRetrieveProfilIdentity()
  return (
    <VStack gap="4" align="stretch">
      <Card.Root variant="primary">
        <Card.Header>
          <Heading size="xl">{t("Galaxy Member")}</Heading>
        </Card.Header>
        <Card.Body>
          <Skeleton loading={isUserGMsLoading} w="full" h="full" minH="400px" borderRadius="md">
            {userGMs.length === 0 ? (
              <EmptyStateCard
                icon={
                  <Icon boxSize={36}>
                    <NftEarthIcon />
                  </Icon>
                }
                title={t("No GM NFTs found.")}
                {...(isConnectedUser
                  ? {
                      description: t(
                        "Accumulate B3TR and participate in the allocation rounds to be able to mint a GM NFT.",
                      ),
                      action: {
                        label: t("Go to Round Info"),
                        onClick: () => router.push("/allocations/round"),
                      },
                    }
                  : {})}
              />
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
