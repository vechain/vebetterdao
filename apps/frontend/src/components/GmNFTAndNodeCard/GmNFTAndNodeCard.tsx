import { Card, Heading, HStack, Stack, useMediaQuery, VStack, Flex } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { useWallet } from "@vechain/vechain-kit"
import { SwapB3trVot3 } from "./components/SwapB3trVot3"
import { FeatureFlagWrapper } from "../FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { GmNFTCard } from "./components/GmNFTCard"
import { XNodeCard } from "./components/XNodeCard"
import { GmNFTAndNodeFooter } from "./components/GmNFTAndNodeFooter"
import { useGmNFTState } from "./hooks/useGmNFTState"
import { useXNodeState } from "./hooks/useXNodeState"
import { useMemo } from "react"
import { useDomainOrAddress } from "@/hooks"

export const GmNFTAndNodeCard = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { isConnectedUser, domain, profile, isOnProfilePage, viewMode } = useRetrieveProfilIdentity()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })

  const {
    hasUserVoted,
    gmImage,
    gmName,
    gmLevel,
    gmRewardMultiplier,
    isGMLoading,
    isGMOwned,
    isXNodeAttachedToGM,
    goToGmNftPage,
  } = useGmNFTState(profile)

  const { xNodeName, xNodeImage, xNodePoints, isXNodeHolder, isXNodeDelegator, goToXNodePage } = useXNodeState(profile)

  const nodeAttachedColor = isXNodeAttachedToGM ? "#B1F16C" : "#FFFFFF80"

  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const headingText = useMemo(() => {
    if (!isGMOwned) {
      if (!hasUserVoted) {
        return t(
          isConnectedUser || !isOnProfilePage
            ? "Vote to be a galaxy member"
            : "{{value}} needs to vote to be a galaxy member",
          {
            value: domainOrAddress,
          },
        )
      } else {
        return isConnectedUser
          ? t("Mint GM to be a galaxy member")
          : t("{{value}} needs to mint GM to be a galaxy member", {
              value: domainOrAddress,
            })
      }
    }

    return isConnectedUser || !isOnProfilePage
      ? t("Your galaxy member")
      : t("{{value}} is a galaxy member", { value: domainOrAddress })
  }, [isGMOwned, hasUserVoted, t, isConnectedUser, isOnProfilePage, domainOrAddress])

  if (!account?.address && !viewMode) {
    return <NotConnectedWallet />
  }

  return (
    <Card
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage="url('/assets/backgrounds/cloud-background.webp')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat">
      <Stack gap={8} align="stretch" justify={"stretch"} direction={isAbove1200 ? "row" : "column-reverse"}>
        <VStack flex="3" align={"stretch"} gap="24px">
          <HStack gap="40px" align={"baseline"} justify={"space-between"}>
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Heading fontSize="xl" fontWeight={600}>
                  {t("Your Galaxy Member")}
                </Heading>
              }>
              <Heading fontSize="xl" fontWeight={600}>
                {headingText}
              </Heading>
            </FeatureFlagWrapper>
          </HStack>

          <Stack gap="4" direction={isAbove800 ? "row" : "column"} align="stretch" justify="stretch">
            <GmNFTCard
              isGMOwned={isGMOwned}
              isGMLoading={isGMLoading}
              gmImage={gmImage}
              gmName={gmName}
              gmLevel={gmLevel}
              gmRewardMultiplier={gmRewardMultiplier}
              nodeAttachedColor={nodeAttachedColor}
              viewMode={viewMode}
              onCardClick={goToGmNftPage}
              domain={domain}
              profile={profile}
            />

            {(isXNodeHolder || isXNodeDelegator) && (
              <>
                <XNodeCard
                  xNodeName={xNodeName}
                  xNodeImage={xNodeImage}
                  xNodePoints={xNodePoints}
                  isXNodeHolder={isXNodeHolder}
                  isXNodeDelegator={isXNodeDelegator}
                  nodeAttachedColor={nodeAttachedColor}
                  viewMode={viewMode}
                  onCardClick={goToXNodePage}
                />
              </>
            )}
          </Stack>
          {!isOnProfilePage && <GmNFTAndNodeFooter />}
        </VStack>
        {!isOnProfilePage && <Flex w={isAbove800 ? "1px" : "auto"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF80" />}
        {account?.address && !isOnProfilePage && <SwapB3trVot3 address={account?.address} />}
      </Stack>
    </Card>
  )
}
