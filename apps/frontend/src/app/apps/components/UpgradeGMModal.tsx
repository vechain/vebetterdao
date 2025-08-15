import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { B3TRIcon, CustomModalContent, FeatureFlagWrapper } from "@/components"
import {
  Button,
  Box,
  Image,
  Dialog,
  Heading,
  Text,
  VStack,
  HStack,
  Stack,
  useMediaQuery,
  Card,
  Alert,
  Skeleton,
} from "@chakra-ui/react"
import { UilArrowCircleUp, UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { getLevelGradient, useNextLevelImage } from "@/api"
import { buttonClickActions, buttonClicked, ButtonClickProperties, FeatureFlag } from "@/constants"
import { gmNfts } from "@/constants/gmNfts"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
const compactFormatter = getCompactFormatter(2)
interface UpgradeGMModalProps {
  gmLevel: string
  tokenId: string
  b3trToUpgradeGMToNextLevel: string
  isOpen: boolean
  onClose: () => void
  sendTransaction: () => void
}

export const UpgradeGMModal: React.FC<UpgradeGMModalProps> = ({
  gmLevel,
  tokenId,
  b3trToUpgradeGMToNextLevel,
  isOpen,
  onClose,
  sendTransaction,
}) => {
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

  const { t } = useTranslation()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Get the next level GM NFT image
  const { nextLevelGMImage, isLoading: nextLevelGMImageLoading } = useNextLevelImage(Number(gmLevel))

  const levelAfterUpgrade = useMemo(() => {
    const currentLevel = Number(gmLevel ?? 1) - 1 // gmNfts start from 1
    const nextLevel = currentLevel + 1 // GMNFTs lists start from 0
    return nextLevel
  }, [gmLevel])

  const nextLevelGM = useMemo(() => {
    return gmNfts.at(levelAfterUpgrade)
  }, [levelAfterUpgrade])

  const handleUpgradeGM = useCallback(() => {
    handleClose()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.UPGRADED_GM))
    sendTransaction()
  }, [handleClose, sendTransaction])

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose} size={"lg"}>
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <Dialog.CloseTrigger />
        <Dialog.Header>
          <VStack gap={4} align="flex-start">
            <UilArrowCircleUp cursor="pointer" size="50px" color="#004CFC" />
            <Heading fontSize="xl">{t("Upgrade GM NFT")}</Heading>
          </VStack>
        </Dialog.Header>
        <Dialog.Body gap={[0, 4]} pt={0}>
          <Text fontSize={["16px"]} color="#6A6A6A">
            {t(
              "Donate B3TR to upgrade your GM NFT and earn extra rewards each time you vote on a proposal or allocation!",
            )}
          </Text>
          <VStack align="stretch" w="full" py={[2, 5]}>
            <Text color="#6A6A6A" fontSize={["16px"]}>
              {t("You'll donate")}
            </Text>
            <HStack>
              <B3TRIcon boxSize={7} />
              <Heading fontSize="x-large" fontWeight={700}>
                {compactFormatter.format(Number(b3trToUpgradeGMToNextLevel))}
              </Heading>
            </HStack>
          </VStack>
          <VStack align="stretch" py={[2, 5]}>
            <Text color="#6A6A6A" textStyle={"md"}>
              {t("You’re upgrading to")}
            </Text>
            {/*GM CARD */}
            <Card.Root>
              <Image
                src={"/assets/backgrounds/nft-page-background.webp"}
                alt="gm-nft-header"
                position={"absolute"}
                w="full"
                h="full"
                rounded={"8px"}
              />
              <Stack
                direction={isAbove800 ? "row" : "column"}
                p={isAbove800 ? "16px" : "12px"}
                align={isAbove800 ? "stretch" : "flex-start"}
                gap={2}
                zIndex={"2"}
                h={"full"}>
                <HStack
                  align={isAbove800 ? "stretch" : "center"}
                  justify="space-between"
                  rounded="12px"
                  gap={isAbove800 ? 5 : 3}
                  flex={1}
                  color="#FFFFFF"
                  flexGrow={4}>
                  <Box
                    w={isAbove800 ? "70px" : "46px"}
                    h={isAbove800 ? "70px" : "46px"}
                    rounded="8px"
                    bgGradient={
                      gmLevel && !isNaN(Number(gmLevel)) ? getLevelGradient(Number(gmLevel) + 1) : getLevelGradient(1)
                    }
                    display="flex"
                    alignSelf="center"
                    alignItems="center"
                    justifyContent="center">
                    <Skeleton loading={nextLevelGMImageLoading}>
                      <Image
                        src={nextLevelGMImage}
                        alt="gm"
                        w={isAbove800 ? "64px" : "42px"}
                        h={isAbove800 ? "64px" : "42px"}
                        rounded="7px"
                      />
                    </Skeleton>
                  </Box>
                  <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 0.5 : 0}>
                    <Text fontWeight={700} lineClamp={1} fontSize={isAbove800 ? "x-large" : "md"}>
                      {`${nextLevelGM?.name} #${tokenId}`}
                    </Text>
                    <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                      <HStack rounded="8px" justifyContent="space-between">
                        <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                          {nextLevelGM?.multiplier}
                        </Text>
                        <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} lineClamp={1}>
                          {t("GM reward weight").toLowerCase()}
                        </Text>
                      </HStack>
                    </FeatureFlagWrapper>
                  </VStack>
                </HStack>
              </Stack>
            </Card.Root>
            {/*END GM CARD */}
          </VStack>
          <VStack align="stretch" w="full" py={[2, 5]}>
            <Alert.Root bg={"rgb(255, 250, 235)"} borderRadius="2xl">
              <UilInfoCircle color={"rgb(217, 119, 6)"} size={"50px"} />
              <Box lineHeight="1.20rem">
                <Text px={3} color={"rgb(217, 119, 6)"} fontSize={["12px", "16px"]}>
                  {t(
                    "The B3TR you spend to upgrade your NFT will be taken from your wallet. You cannot undo this action.",
                  )}
                </Text>
              </Box>
            </Alert.Root>
          </VStack>
        </Dialog.Body>

        <Dialog.Footer w="full" px={4} pt={1}>
          <VStack align="stretch" w="full">
            <Button variant={"primaryAction"} w={"full"} onClick={handleUpgradeGM}>
              {t("Upgrade GM NFT")}
            </Button>
            <Button unstyled fontWeight={700} color={"#004CFC"} w={"full"} onClick={handleClose}>
              {t("Maybe later")}
            </Button>
          </VStack>
        </Dialog.Footer>
      </CustomModalContent>
    </Dialog.Root>
  )
}
