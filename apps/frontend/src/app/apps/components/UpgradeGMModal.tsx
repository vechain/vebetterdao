import { Button, Box, Dialog, Heading, Text, VStack, HStack, Card, Alert, CloseButton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { gmNfts } from "@/constants/gmNfts"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { useNextLevelImage } from "../../../api/contracts/galaxyMember/hooks/useNextLevelImage"
import { CustomModalContent } from "../../../components/CustomModalContent"
import { GMNFTCard } from "../../../components/GMNFTCard"
import { B3TRIcon } from "../../../components/Icons/B3TRIcon"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"

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
  const { t } = useTranslation()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const { nextLevelGMImage, isLoading: nextLevelGMImageLoading } = useNextLevelImage(Number(gmLevel))

  const levelAfterUpgrade = useMemo(() => {
    return Number(gmLevel ?? 1)
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
        <Dialog.CloseTrigger asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
        <Dialog.Header>
          <Heading textStyle="xl">{t("Upgrade GM NFT")}</Heading>
        </Dialog.Header>
        <Dialog.Body gap={[0, 4]} pt={0}>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "Burn B3TR to upgrade your GM NFT level. A higher level increases your reward weight, earning you a bigger share of the GM Rewards Pool each time you vote.",
            )}
          </Text>
          <VStack align="stretch" w="full" py={[2, 5]}>
            <Text color="text.subtle" textStyle="sm">
              {t("You'll donate")}
            </Text>
            <HStack>
              <B3TRIcon boxSize={7} />
              <Heading size="xl">
                {compactFormatter.format(Number(b3trToUpgradeGMToNextLevel))} {"B3TR"}
              </Heading>
            </HStack>
          </VStack>
          <VStack align="stretch" py={[2, 5]}>
            <Text color="text.subtle" textStyle="sm">
              {t("You're upgrading to")}
            </Text>
            <Card.Root position="relative">
              <GMNFTCard
                imageUrl={nextLevelGMImage}
                name={`${nextLevelGM?.name} #${tokenId}`}
                tokenLevel={gmLevel && !isNaN(Number(gmLevel)) ? Number(gmLevel) + 1 : 1}
                multiplier={nextLevelGM?.multiplier}
                isLoading={nextLevelGMImageLoading}
                size={"medium"}
              />
            </Card.Root>
            {nextLevelGM && (
              <Text textStyle="sm" color="text.subtle" pt={2}>
                {t("Your reward weight will increase to {{multiplier}}x", { multiplier: nextLevelGM.multiplier })}
              </Text>
            )}
          </VStack>
          <Alert.Root status="warning" borderRadius="2xl">
            <Alert.Indicator w={5} h={5} />
            <Box textStyle="sm">
              <Alert.Description as="span">
                {t(
                  "The B3TR you spend to upgrade your NFT will be taken from your wallet. You cannot undo this action.",
                )}
              </Alert.Description>
            </Box>
          </Alert.Root>
        </Dialog.Body>

        <Dialog.Footer w="full" px={4} pt={1}>
          <VStack align="stretch" w="full">
            <Button variant={"primary"} w={"full"} onClick={handleUpgradeGM}>
              {t("Upgrade GM NFT")}
            </Button>
            <Button variant="link" w={"full"} onClick={handleClose}>
              {t("Maybe later")}
            </Button>
          </VStack>
        </Dialog.Footer>
      </CustomModalContent>
    </Dialog.Root>
  )
}
