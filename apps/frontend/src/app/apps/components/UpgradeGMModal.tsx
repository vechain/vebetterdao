import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  B3TRIcon,
  CustomModalContent,
  FeatureFlagWrapper,
  TransactionModal,
  TransactionModalStatus,
} from "@/components"
import { useUpgradeGM } from "@/hooks"
import {
  Button,
  useDisclosure,
  Box,
  Image,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  Heading,
  ModalBody,
  Text,
  ModalFooter,
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
  upgradeGMModal: ReturnType<typeof useDisclosure>
}

export const UpgradeGMModal: React.FC<UpgradeGMModalProps> = ({
  gmLevel,
  tokenId,
  b3trToUpgradeGMToNextLevel,
  upgradeGMModal,
}) => {
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { t } = useTranslation()

  const upgradeGMMutation = useUpgradeGM({
    tokenId,
    b3trToUpgrade: b3trToUpgradeGMToNextLevel,
  })

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
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.UPGRADED_GM))
    upgradeGMMutation.sendTransaction({})
  }, [upgradeGMMutation])

  const handleClose = useCallback(() => {
    upgradeGMMutation.resetStatus()
    upgradeGMModal.onClose()
  }, [upgradeGMMutation, upgradeGMModal])

  const onTryAgain = useCallback(() => {
    upgradeGMMutation.resetStatus()
    upgradeGMMutation.sendTransaction({})
  }, [upgradeGMMutation])

  if (upgradeGMMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={upgradeGMModal.isOpen}
        onClose={handleClose}
        successTitle={t("GM NFT upgraded")}
        status={
          upgradeGMMutation.error ? TransactionModalStatus.Error : (upgradeGMMutation.status as TransactionModalStatus)
        }
        errorDescription={upgradeGMMutation.error?.reason}
        errorTitle={upgradeGMMutation.error ? "Error upgrading GM NFT" : undefined}
        onTryAgain={onTryAgain}
        pendingTitle={"Upgrading GM NFT..."}
        showExplorerButton
        txId={upgradeGMMutation.txReceipt?.meta.txID}
      />
    )

  return (
    <>
      <Modal isOpen={upgradeGMModal.isOpen} onClose={handleClose} size={"2xl"}>
        <ModalOverlay />
        <CustomModalContent p={{ base: 3, md: 5 }}>
          <ModalCloseButton />
          <ModalHeader>
            <VStack gap={4} align="flex-start">
              <UilArrowCircleUp cursor="pointer" size="50px" color="#004CFC" />
              <Heading fontSize="xl">{t("Upgrade GM NFT")}</Heading>
            </VStack>
          </ModalHeader>
          <ModalBody gap={[0, 4]} pt={0}>
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
              <Text color="#6A6A6A" size={"md"}>
                {t("You’re upgrading to")}
              </Text>
              {/*GM CARD */}
              <Card>
                <Image
                  src={"/images/nft-page-background.png"}
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
                  spacing={2}
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
                      <Skeleton isLoaded={!nextLevelGMImageLoading}>
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
                      <Text fontWeight={700} noOfLines={1} fontSize={isAbove800 ? "x-large" : "md"}>
                        {`${nextLevelGM?.name} #${tokenId}`}
                      </Text>
                      <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                        <HStack rounded="8px" gap={1} color={""}>
                          <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                            {nextLevelGM?.multiplier}
                            {"x"}
                          </Text>
                          <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} noOfLines={1}>
                            {t("Voting reward multiplier").toLowerCase()}
                          </Text>
                        </HStack>
                      </FeatureFlagWrapper>
                    </VStack>
                  </HStack>
                </Stack>
              </Card>
              {/*END GM CARD */}
            </VStack>
            <VStack align="stretch" w="full" py={[2, 5]}>
              <Alert bg={"rgb(255, 250, 235)"} borderRadius="2xl">
                <UilInfoCircle color={"rgb(217, 119, 6)"} size={"50px"} />
                <Box lineHeight="1.20rem">
                  <Text px={3} color={"rgb(217, 119, 6)"} fontSize={["12px", "16px"]}>
                    {t(
                      "The B3TR you spend to upgrade your NFT will be taken from your wallet. You cannot undo this action.",
                    )}
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter w="full" px={4} pt={1}>
            <VStack align="stretch" w="full">
              <Button variant={"primaryAction"} w={"full"} onClick={handleUpgradeGM}>
                {t("Upgrade GM NFT")}
              </Button>
              <Button variant={"secondaryAction"} color={"#004CFC"} w={"full"} onClick={upgradeGMModal.onClose}>
                {t("Maybe later")}
              </Button>
            </VStack>
          </ModalFooter>
        </CustomModalContent>
      </Modal>
    </>
  )
}
