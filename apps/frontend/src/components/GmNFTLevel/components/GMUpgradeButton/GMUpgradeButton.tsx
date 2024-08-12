import { Box, Button, Circle, HStack, Skeleton, Stack, Text, useDisclosure, useMediaQuery } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCurrentAllocationsRoundId, useIsGMclaimable, useParticipatedInGovernance, useUserB3trBalance } from "@/api"
import { useCallback, useMemo } from "react"
import { SparklesIcon } from "@/components/Icons"
import { useRouter } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"
import { useClaimNFT } from "@/hooks"
import { MintNFTModal } from "./components/MintNFTModal"

const compactFormatter = getCompactFormatter(4)

export const GMUpgradeButton = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account)
  const { isClaimable: isGMClaimable, isOwned: isGMOwned } = useIsGMclaimable()
  // TODO: map data
  const isNodeHolder = false
  const isNodeAttached = true
  const b3trToUpgradeGM = 5000000
  const rewardMultiplier = "X3"

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useUserB3trBalance()

  const isEnoughBalanceToUpgradeGM = b3trBalance && Number(b3trBalance.scaled) >= b3trToUpgradeGM

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
      if (isNodeHolder) {
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

    if (isNodeHolder && !isNodeAttached) {
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
            {t("You can upgrade and get {{rewardMultiplier}} on your rewards for", { rewardMultiplier })}
          </Text>{" "}
          <Text as="span" fontSize={"16px"} color="#B1F16C">
            {compactFormatter.format(b3trToUpgradeGM)}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {"!"}
          </Text>
        </Box>
      )
    } else {
      const missingB3tr = b3trToUpgradeGM - Number(b3trBalance?.scaled || 0)

      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You need")}
          </Text>{" "}
          <Text as="span" fontSize={"14px"} color="#B1F16C">
            {t("{{b3trToUpgradeGM}} B3TR", { b3trToUpgradeGM: compactFormatter.format(missingB3tr) })}
          </Text>{" "}
          <Text as="span" fontSize={"14px"}>
            {t("to upgrade your NFT to the next level")}
          </Text>
        </Box>
      )
    }
  }, [
    b3trBalance?.scaled,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMClaimable,
    isGMOwned,
    isNodeAttached,
    isNodeHolder,
    t,
  ])

  const actionLabel = useMemo(() => {
    if (!hasUserVoted && !isGMOwned && !isGMClaimable) {
      return t("Vote now!")
    }
    if (!isGMOwned) {
      return t("Mint now!")
    }
    if (isNodeHolder && !isNodeAttached) {
      return t("Attach and Upgrade!")
    }
    return t("Upgrade now!")
  }, [hasUserVoted, isGMClaimable, isGMOwned, isNodeAttached, isNodeHolder, t])

  const router = useRouter()
  const mintNftModal = useDisclosure()
  const {
    sendTransaction: freeMint,
    isTxReceiptLoading,
    sendTransactionPending,
  } = useClaimNFT({ onFailure: mintNftModal.onClose })

  const handleMintGM = useCallback(() => {
    console.log("handleMintGM")
    freeMint()
    mintNftModal.onOpen()
  }, [freeMint, mintNftModal])

  const action = useCallback(() => {
    if (!hasUserVoted && !isGMOwned && !isGMClaimable) {
      router.push(`/rounds/${currentRoundId}/vote`)
      return
    }
    if (!isGMOwned && isGMClaimable) {
      return handleMintGM()
    }
    if (isNodeHolder && !isNodeAttached) {
      // TODO: add action
      return
    }
    return
  }, [currentRoundId, handleMintGM, hasUserVoted, isGMClaimable, isGMOwned, isNodeAttached, isNodeHolder, router])

  const isActionDisabled = useMemo(() => {
    if (!isGMClaimable && !isGMOwned) {
      return true
    }
    if ((isNodeHolder && !isNodeAttached) || !isGMOwned) {
      return false
    }
    return !isEnoughBalanceToUpgradeGM
  }, [isEnoughBalanceToUpgradeGM, isGMClaimable, isGMOwned, isNodeAttached, isNodeHolder])

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
    </Stack>
  )
}
