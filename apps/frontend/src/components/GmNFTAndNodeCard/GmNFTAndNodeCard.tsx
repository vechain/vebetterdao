import {
  Card,
  Heading,
  HStack,
  Stack,
  useMediaQuery,
  VStack,
  Flex,
  Image,
  Skeleton,
  useDisclosure,
  Box,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { useWallet } from "@vechain/vechain-kit"
import { SwapB3trVot3 } from "./components/SwapB3trVot3"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { useMemo } from "react"
import { useBreakpoints, useGetB3trBalance } from "@/hooks"
import { useGetUserGMs, useGetUserNodes } from "@/api"
import { GmEmptyStateCard } from "./GmEmptyStateCard"
import { GmActionButton } from "../GmActionButton"
import { GmCard } from "./GmCard"
import { useRouter } from "next/navigation"
import { GetNodeModal } from "./GetNodeModal"

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

  const router = useRouter()

  const isLoading = isUserGMsLoading || isNodesLoading
  const userHasNoNodeOrGm = !isLoading && userGMs?.length === 0 && nodes?.allNodes?.length === 0

  const totalPoints = useMemo(() => {
    return nodes?.allNodes?.reduce((acc, node) => acc + node.xNodePoints, 0) || 0
  }, [nodes])

  const [isAbove1200] = useMediaQuery(["(min-width: 1200px)"])
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

  if (!account?.address && !viewMode) {
    return <NotConnectedWallet />
  }

  if (isLoading) {
    return <Skeleton height={isMobile ? "400px" : "250px"} width="100%" rounded="12px" />
  }

  return (
    <Card.Root
      bg="banner.blue"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      // bgImage="url('/assets/backgrounds/cloud-background.webp')"
      //bgSize="cover"
      //backgroundPosition="center"
      //bgRepeat="no-repeat"
    >
      <Card.Body p={0}>
        <Stack
          gap={8}
          align="stretch"
          justify={userHasNoNodeOrGm ? "center" : "stretch"}
          direction={isAbove1200 ? "row" : "column-reverse"}>
          <VStack flex="3" align={"stretch"} gap="24px" px="2px">
            <HStack gap="40px" align={"baseline"} justify={"space-between"}>
              <Heading textStyle="xl" fontWeight="bold" color="text.strong">
                {t("Your NFTs")}
              </Heading>
            </HStack>

            {userHasNoNodeOrGm ? (
              <GmEmptyStateCard
                icon={<Image src="/assets/icons/nft-earth-dark.png" alt="NFT Earth Illustration" boxSize="60px" />}
                text={t(
                  "Get NFT and start receiving rewards. After you vote first time you will receive free Galaxy Member - Earth NFT.",
                )}
              />
            ) : (
              <Stack
                gap="1.5rem"
                direction={isAbove800 ? "row" : "column"}
                align={isAbove800 ? "center" : "stretch"}
                justify="center">
                {userGMs && userGMs?.length > 0 ? (
                  <GmCard
                    subtitle={t("Galaxy Member")}
                    title={selectedGM?.metadata?.name || "name"}
                    footer={`${selectedGM?.multiplier || 0}x ${t("GM reward weight")}`}
                    images={selectedGM?.metadata?.image ? [selectedGM?.metadata?.image] : []}
                    onCardClick={() => router.push(`/galaxy-member/${selectedGM?.tokenId}`)}
                  />
                ) : (
                  <GmEmptyStateCard
                    icon={<Image src="/assets/icons/nft-earth-dark.png" alt="NFT Earth Illustration" boxSize="60px" />}
                    text={t("Get NFT and start receiving rewards.")}
                  />
                )}

                {nodes?.allNodes && nodes?.allNodes?.length > 0 ? (
                  <GmCard
                    title={`${nodes?.allNodes?.[0]?.name || ""} #${nodes?.allNodes?.[0]?.nodeId || ""}`}
                    subtitle={"Nodes"}
                    footer={`Total: ${totalPoints} points`}
                    images={nodes?.allNodes?.map(node => node.image)}
                    onCardClick={() => router.push(`/profile?tab=nodes`)}
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

            <Box ml="auto">
              <GmActionButton
                b3trBalanceScaled={b3trBalance?.scaled}
                buttonProps={{
                  size: "md",
                  variant: "secondary",
                  w: "fit-content",
                }}
              />
            </Box>
          </VStack>
          {!isOnProfilePage && <Flex w={isAbove800 ? "1px" : "auto"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF80" />}

          {account?.address && !isOnProfilePage && (
            <SwapB3trVot3
              address={account?.address}
              containerProps={
                userHasNoNodeOrGm && !isMobile
                  ? {
                      maxW: "fit-content",
                      minW: "40%",
                    }
                  : undefined
              }
            />
          )}
        </Stack>

        <GetNodeModal isOpen={isGetGMAndNodeModalOpen} onClose={onCloseGetGMAndNodeModal} />
      </Card.Body>
    </Card.Root>
  )
}
