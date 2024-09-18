import { Box, Button, Circle, HStack, Skeleton, Stack, Text, useDisclosure, useMediaQuery } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import {
  useCurrentAllocationsRoundId,
  useSelectedGmNft,
  useParticipatedInGovernance,
  useUserB3trBalance,
  useXNode,
} from "@/api"
import { useCallback, useMemo } from "react"
import { SparklesIcon } from "@/components/Icons"
import { useRouter } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"
import { useClaimNFT } from "@/hooks"
import { MintNFTModal } from "./components/MintNFTModal"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"

const compactFormatter = getCompactFormatter(4)

export const GMUpgradeButton = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account)
  const {
    nextLevelGMRewardMultiplier,
    isGMOwned,
    isGMClaimable,
    b3trToUpgradeGMToNextLevel,
    missingB3trToUpgrade,
    isEnoughBalanceToUpgradeGM,
    isXNodeAttachedToGM,
  } = useSelectedGmNft()
  const { isXNodeHolder } = useXNode()

  const { isLoading: isB3trBalanceLoading } = useUserB3trBalance()

  const upgradeMessage = useMemo(() => {
    if (!hasUserVoted && !isGMOwned && !isGMClaimable) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Vote and mint the GM NFT for free!")}
          </Text>
        </Box>
      )
    }
    if (!isGMClaimable && !isGMOwned) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Wait for the next round to mint the GM NFT")}
          </Text>
        </Box>
      )
    }
    if (!isGMOwned) {
      if (isXNodeHolder) {
        return (
          <Box>
            <Text as="span" fontSize={"14px"}>
              {t("Mint a GM NFT for free! You can attach it your Node and get free upgrades!")}
            </Text>
          </Box>
        )
      } else {
        return (
          <Box>
            <Text as="span" fontSize={"14px"}>
              {t("Mint a GM NFT for free and get more rewards!")}
            </Text>
          </Box>
        )
      }
    }

    if (isXNodeHolder && !isXNodeAttachedToGM) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Attach your XNode to you GM NFT and")}{" "}
          </Text>
          <Text as="strong" fontSize={"14px"} fontWeight={600}>
            {t("upgrade")}
          </Text>{" "}
          <Text as="span" fontSize={"14px"}>
            {t("it to Venus for free!")}
          </Text>
        </Box>
      )
    }

    if (isEnoughBalanceToUpgradeGM) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You can upgrade and get {{rewardMultiplier}}x on your rewards for", {
              rewardMultiplier: nextLevelGMRewardMultiplier,
            })}
          </Text>{" "}
          <Text as="span" fontSize={"16px"} color="#B1F16C">
            {compactFormatter.format(b3trToUpgradeGMToNextLevel)}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {"!"}
          </Text>
        </Box>
      )
    } else {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You need")}
          </Text>{" "}
          <Text as="span" fontSize={"14px"} color="#B1F16C">
            {t("{{b3trToUpgradeGM}} B3TR", { b3trToUpgradeGM: compactFormatter.format(missingB3trToUpgrade) })}
          </Text>{" "}
          <Text as="span" fontSize={"14px"}>
            {t("to upgrade your NFT to the next level")}
          </Text>
        </Box>
      )
    }
  }, [
    b3trToUpgradeGMToNextLevel,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMClaimable,
    isGMOwned,
    isXNodeAttachedToGM,
    isXNodeHolder,
    missingB3trToUpgrade,
    nextLevelGMRewardMultiplier,
    t,
  ])

  const actionLabel = useMemo(() => {
    if (!hasUserVoted && !isGMOwned && !isGMClaimable) {
      return t("Vote now!")
    }
    if (!isGMOwned) {
      return t("Mint now!")
    }
    if (isXNodeHolder && !isXNodeAttachedToGM) {
      return t("Attach and Upgrade!")
    }
    return t("Upgrade now!")
  }, [hasUserVoted, isGMClaimable, isGMOwned, isXNodeAttachedToGM, isXNodeHolder, t])

  const router = useRouter()
  const mintNftModal = useDisclosure()
  const {
    sendTransaction: freeMint,
    isTxReceiptLoading,
    sendTransactionPending,
  } = useClaimNFT({ onFailure: mintNftModal.onClose })

  const handleMintGM = useCallback(() => {
    freeMint()
    mintNftModal.onOpen()
  }, [freeMint, mintNftModal])

  const attachGmToXNodeModal = useDisclosure()

  const action = useCallback(() => {
    if (!hasUserVoted && !isGMOwned && !isGMClaimable) {
      router.push(`/rounds/${currentRoundId}/vote`)
      return
    }
    if (!isGMOwned && isGMClaimable) {
      return handleMintGM()
    }
    if (isXNodeHolder && !isXNodeAttachedToGM) {
      attachGmToXNodeModal.onOpen()
      return
    }
    return
  }, [
    attachGmToXNodeModal,
    currentRoundId,
    handleMintGM,
    hasUserVoted,
    isGMClaimable,
    isGMOwned,
    isXNodeAttachedToGM,
    isXNodeHolder,
    router,
  ])

  const isActionDisabled = useMemo(() => {
    if ((isXNodeHolder && !isXNodeAttachedToGM) || !isGMOwned) {
      return false
    }
    return !isEnoughBalanceToUpgradeGM
  }, [isEnoughBalanceToUpgradeGM, isGMOwned, isXNodeAttachedToGM, isXNodeHolder])

  return (
    <Stack
      justify="space-between"
      align={isAbove1200 ? "center" : "stretch"}
      direction={isAbove1200 ? "row" : "column"}
      gap={"20px"}>
      <Skeleton isLoaded={!isB3trBalanceLoading}>
        <HStack gap={2}>
          {isGMOwned ? (
            <UilArrowCircleUp size={"30px"} color="#B1F16C" />
          ) : (
            <Circle overflow={"hidden"} size={"20px"} border="2px solid #B1F16C">
              <SparklesIcon />
            </Circle>
          )}
          {upgradeMessage}
        </HStack>
      </Skeleton>
      <Skeleton isLoaded={!isB3trBalanceLoading}>
        <Button variant={"tertiaryAction"} isDisabled={isActionDisabled} w="full" onClick={action}>
          {actionLabel}
        </Button>
      </Skeleton>
      <MintNFTModal
        mintNftModal={mintNftModal}
        isTxReceiptLoading={isTxReceiptLoading}
        sendTransactionPending={sendTransactionPending}
      />
      <AttachGMToXNodeModal isOpen={attachGmToXNodeModal.isOpen} onClose={attachGmToXNodeModal.onClose} />
    </Stack>
  )
}
