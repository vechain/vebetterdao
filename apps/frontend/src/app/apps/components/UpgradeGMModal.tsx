import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { B3TRIcon, CustomModalContent, FeatureFlagWrapper, TransactionModal } from "@/components"
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
} from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { getLevelGradient } from "@/api"
import { FeatureFlag } from "@/constants"
import { gmNfts } from "@/constants/gmNfts"

const compactFormatter = getCompactFormatter(2)
interface UpgradeGMModalProps {
  gmLevel: number
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

  const levelAfterUpgrade = useMemo(() => {
    const currentLevel = Number(gmLevel ?? 1) - 1 //gmNfts start from 1
    const nextLevel = currentLevel + 1 //GMNFTs lists start from 0
    return nextLevel
  }, [gmLevel])

  const nextLevelGM = useMemo(() => {
    return gmNfts.at(levelAfterUpgrade)
  }, [levelAfterUpgrade])

  const handleUpgradeGM = useCallback(() => {
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
        status={upgradeGMMutation.error ? "error" : upgradeGMMutation.status}
        errorDescription={upgradeGMMutation.error?.reason}
        errorTitle={upgradeGMMutation.error ? "Error upgrading GM NFT" : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={"Upgrading GM NFT..."}
        showExplorerButton
        txId={upgradeGMMutation.txReceipt?.meta.txID ?? upgradeGMMutation.sendTransactionTx?.txid}
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
          <ModalBody gap={4}>
            <Text size={"md"}>
              {t(
                "Donate B3TR to upgrade your GM NFT and earn extra rewards each time you vote on a proposal or allocation!",
              )}
            </Text>
            <VStack align="stretch" w="full" py={5}>
              <Text color="#6A6A6A" size={"md"}>
                {t("You'll donate")}
              </Text>
              <HStack>
                <B3TRIcon boxSize={9} />
                <Heading fontSize="xl" fontWeight={700}>
                  {compactFormatter.format(b3trToUpgradeGMToNextLevel)}
                </Heading>
              </HStack>
            </VStack>
            <VStack align="stretch" w="full" py={5}>
              <Text color="#6A6A6A" size={"md"}>
                {t("You’re upgrading to")}
              </Text>
              {/*GM CARD */}
              <Card>
                <Image
                  src={"/images/nft-page-background.png"}
                  alt="gm-nft-header"
                  position={"absolute"}
                  w="100%"
                  h="100%"
                  rounded={"16px"}
                />
                <Stack
                  direction={isAbove800 ? "row" : "column"}
                  p={isAbove800 ? "24px" : "16px"}
                  align={isAbove800 ? "stretch" : "flex-start"}
                  spacing={4}
                  zIndex={"2"}>
                  <HStack
                    align={isAbove800 ? "stretch" : "center"}
                    justify="space-between"
                    rounded="12px"
                    gap={6}
                    flex={1}
                    color="#FFFFFF"
                    flexGrow={4}>
                    <Box
                      w={isAbove800 ? "132px" : "68px"}
                      h={isAbove800 ? "132px" : "68px"}
                      rounded="8px"
                      bgGradient={getLevelGradient(Number(levelAfterUpgrade))}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer">
                      <Image
                        src={nextLevelGM?.image}
                        alt="gm"
                        w={isAbove800 ? "126px" : "64px"}
                        h={isAbove800 ? "126px" : "64px"}
                        rounded="7px"
                      />
                    </Box>

                    <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
                      <Text fontWeight={700} noOfLines={1} fontSize={isAbove800 ? "xl" : "md"}>
                        {nextLevelGM?.name}
                      </Text>
                      <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                        <HStack rounded="8px" padding="4px 8px" gap={1}>
                          <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                            {nextLevelGM?.multiplier}
                            {"x"}
                          </Text>
                          <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} noOfLines={1}>
                            {t("Voting reward multiplier")}
                          </Text>
                        </HStack>
                      </FeatureFlagWrapper>
                    </VStack>
                  </HStack>
                </Stack>
              </Card>
              {/*END GM CARD */}
            </VStack>
          </ModalBody>
          <ModalFooter w="full">
            <VStack align="stretch" w="full">
              <Button variant={"primaryAction"} w={"full"} onClick={handleUpgradeGM}>
                {t("Upgrade GM NFT")}
              </Button>
              <Button variant={"secondaryAction"} w={"full"} onClick={upgradeGMModal.onClose}>
                {t("Maybe later")}
              </Button>
            </VStack>
          </ModalFooter>
        </CustomModalContent>
      </Modal>
    </>
  )
}
