import { Card, Heading, Stack, Flex, Image, Skeleton, useDisclosure, Box, Icon } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGetUserGMs } from "../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGetUserNodes } from "../../api/contracts/xNodes/useGetUserNodes"
import { useRetrieveProfilIdentity } from "../../app/profile/components/utils/useRetrieveProfilIdentity"
import { useBreakpoints } from "../../hooks/useBreakpoints"
import { useGetB3trBalance } from "../../hooks/useGetB3trBalance"
import { GmActionButton } from "../GmActionButton"

import { GetNodeModal } from "./GetNodeModal"
import { GmCard } from "./GmCard"
import { GmEmptyStateCard } from "./GmEmptyStateCard"
import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { SwapB3trVot3 } from "./components/SwapB3trVot3"

import NFTEarthIcon from "@/components/Icons/svg/nft-earth.svg"

export const GmNFTAndNodeCard = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { isOnProfilePage, viewMode } = useRetrieveProfilIdentity()
  const { data: userGMs, isLoading: isUserGMsLoading } = useGetUserGMs()
  const selectedGM = useMemo(() => userGMs?.find(gm => gm.isSelected), [userGMs])
  const { data: nodes, isLoading: isNodesLoading } = useGetUserNodes()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { isMobile } = useBreakpoints()
  const {
    open: isGetGMAndNodeModalOpen,
    onOpen: onOpenGetGMAndNodeModal,
    onClose: onCloseGetGMAndNodeModal,
  } = useDisclosure()
  const isLoading = isUserGMsLoading || isNodesLoading
  const userHasNoNodeOrGm = !isLoading && userGMs?.length === 0 && nodes?.allNodes?.length === 0
  const totalPoints = useMemo(() => {
    return nodes?.allNodes?.reduce((acc, node) => acc + node.xNodePoints, 0) || 0
  }, [nodes])
  if (!account?.address && !viewMode) {
    return <NotConnectedWallet />
  }
  if (isLoading) {
    return <Skeleton height={isMobile ? "96" : "64"} width="full" rounded="xl" />
  }

  return (
    <Card.Root
      asChild
      bg="banner.dashboard-tokens"
      rounded="xl"
      p="6"
      color="white"
      position="relative"
      overflow={"hidden"}>
      <Flex direction={{ base: "column-reverse", md: "row" }} gap="8">
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
            <Stack
              gap="4"
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="center">
              {userGMs && userGMs?.length > 0 ? (
                <GmCard
                  subtitle={t("Galaxy Member")}
                  title={selectedGM?.metadata?.name || "name"}
                  footer={`${selectedGM?.multiplier || 0}x ${t("GM reward weight")}`}
                  images={selectedGM?.metadata?.image ? [selectedGM?.metadata?.image] : []}
                  href={`/galaxy-member/${selectedGM?.tokenId}`}
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

              {nodes?.allNodes && nodes?.allNodes?.length > 0 ? (
                <GmCard
                  title={`${nodes?.allNodes?.[0]?.name || ""} #${nodes?.allNodes?.[0]?.nodeId || ""}`}
                  subtitle={"Nodes"}
                  footer={`Total: ${totalPoints} points`}
                  images={nodes?.allNodes?.map(node => node.image)}
                  href={`/profile?tab=nodes`}
                />
              ) : (
                <GmEmptyStateCard
                  icon={<Image src="/assets/icons/node-placeholder.svg" alt="node-placeholder" />}
                  text={t("You have no nodes yet.")}
                  onCardClick={onOpenGetGMAndNodeModal}
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

        {account?.address && !isOnProfilePage && <SwapB3trVot3 address={account?.address} />}
      </Flex>
      <GetNodeModal isOpen={isGetGMAndNodeModalOpen} onClose={onCloseGetGMAndNodeModal} />
    </Card.Root>
  )
}
