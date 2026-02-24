"use client"

import { Card, Heading, Stack, Flex, Image, Skeleton, Box, Icon } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"

import { useGetUserGMs } from "../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useCreatorNftBalance } from "../../api/contracts/x2EarnCreator/useCreatorNftBalance"
import { useHasCreatorNFT } from "../../api/contracts/x2EarnCreator/useHasCreatorNft"
import { useAppsCountFromCreator } from "../../api/contracts/xApps/hooks/useAppsCountFromCreator"
import { useGetUserNodes, UserNode } from "../../api/contracts/xNodes/useGetUserNodes"
import { useRetrieveProfilIdentity } from "../../app/profile/components/utils/useRetrieveProfilIdentity"
import { useBreakpoints } from "../../hooks/useBreakpoints"
import { useGetB3trBalance } from "../../hooks/useGetB3trBalance"
import { GmActionButton } from "../GmActionButton"

import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { GmCard } from "./GmCard"
import { GmEmptyStateCard } from "./GmEmptyStateCard"

export const GmNFTAndNodeCard = () => {
  const { account } = useWallet()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { viewMode } = useRetrieveProfilIdentity()
  const { data: userGMs, isLoading: isUserGMsLoading } = useGetUserGMs()
  const { data: userNodesInfo, isLoading: isNodesLoading } = useGetUserNodes()
  const { data: hasCreatorNFT } = useHasCreatorNFT(account?.address ?? "")
  const { data: creatorNftBalance } = useCreatorNftBalance(account?.address ?? "")
  const { data: appsCountFromCreator } = useAppsCountFromCreator(account?.address ?? "")
  const { isMobile } = useBreakpoints()
  const selectedGM = useMemo(() => userGMs?.find(gm => gm.isSelected), [userGMs])
  const isLoading = isUserGMsLoading || isNodesLoading
  const userHasNoNodeOrGm =
    !isLoading && userGMs?.length === 0 && userNodesInfo?.nodesManagedByUser?.length === 0 && !hasCreatorNFT
  const submissionsAvailable = Math.max(0, (creatorNftBalance ?? 0) - (appsCountFromCreator ?? 0))
  const creatorNftFooter =
    submissionsAvailable === 1
      ? t("1 app submission available")
      : t("{{count}} app submissions available", { count: submissionsAvailable })

  const totalPoints = userNodesInfo?.totalEndorsementScore?.toString() ?? "0"

  if (!account?.address && !viewMode) {
    return <NotConnectedWallet />
  }

  if (isLoading) {
    return <Skeleton height={isMobile ? "96" : "64"} width="full" rounded="xl" />
  }

  return (
    <Card.Root
      asChild
      variant="outline"
      rounded="xl"
      p="6"
      w="full"
      color="white"
      position="relative"
      overflow={"hidden"}
      border="0">
      <Flex direction={{ base: "column-reverse", md: "column-reverse" }} gap="8">
        <Stack flex={1} gap="4">
          <Heading textStyle="xl" color="white" fontWeight="bold">
            {t("Your NFTs")}
          </Heading>

          {userHasNoNodeOrGm ? (
            <GmEmptyStateCard
              icon={
                <Icon boxSize="60px" color="white">
                  <NFTEarthIcon />
                </Icon>
              }
              text={t(
                "Get NFT and start receiving rewards. After you vote first time you will receive free Galaxy Member - Earth NFT.",
              )}
            />
          ) : (
            <Stack gap="4" direction={{ base: "column", md: "column" }} align="stretch" justify="center">
              {userGMs && userGMs?.length > 0 ? (
                <GmCard
                  subtitle={t("Galaxy Member")}
                  title={selectedGM?.metadata?.name || "name"}
                  footer={`${selectedGM?.multiplier || 0}x ${t("GM reward weight")}`}
                  images={selectedGM?.metadata?.image ? [selectedGM?.metadata?.image] : []}
                  href="/galaxy-member"
                />
              ) : (
                <GmEmptyStateCard
                  icon={
                    <Icon boxSize="60px" color="white">
                      <NFTEarthIcon />
                    </Icon>
                  }
                  text={t("Get NFT and start receiving rewards.")}
                />
              )}

              {userNodesInfo?.nodesManagedByUser && userNodesInfo?.nodesManagedByUser?.length > 0 ? (
                <GmCard
                  title={
                    userNodesInfo?.nodesManagedByUser?.length === 1
                      ? `${userNodesInfo.nodesManagedByUser[0]?.metadata?.name ?? ""} #${userNodesInfo.nodesManagedByUser[0]?.id?.toString() || ""}`
                      : `${userNodesInfo?.nodesManagedByUser?.length} Nodes`
                  }
                  subtitle={"Nodes"}
                  footer={`${totalPoints} endorsement points`}
                  images={userNodesInfo?.nodesManagedByUser?.map((node: UserNode) => node?.metadata?.image)}
                  href="/nodes"
                />
              ) : (
                <GmEmptyStateCard
                  icon={<Image src="/assets/icons/node-placeholder.svg" alt="node-placeholder" />}
                  text={t("You have no nodes yet.")}
                  onCardClick={() => router.push("/nodes")}
                />
              )}

              {hasCreatorNFT && (
                <GmCard
                  subtitle={t("Creator NFT")}
                  title={t("Creator NFT")}
                  footer={creatorNftFooter}
                  images={["/assets/images/creator-nft.webp"]}
                  href="/apps/new/form"
                  imageSize="62px"
                  imageRounded="xl"
                />
              )}
            </Stack>
          )}

          <Box alignSelf="flex-end">
            <GmActionButton
              b3trBalanceScaled={b3trBalance?.scaled}
              buttonProps={{
                size: "md",
                variant: "secondary",
              }}
            />
          </Box>
        </Stack>
      </Flex>
    </Card.Root>
  )
}
