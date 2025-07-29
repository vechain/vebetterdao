import { useCallback, useMemo } from "react"
import { Button, ButtonProps, useDisclosure, Text, HStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useMintNFT, useUpgradeGM } from "@/hooks"
import { UpgradeGMModal } from "@/app/apps/components/UpgradeGMModal"
import { useCurrentAllocationsRoundId, useParticipatedInGovernance, useGMMaxLevel, useGetUserGMs } from "@/api"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { MintNFTModal } from "./MintNFTModal"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { BaseTooltip } from "./BaseTooltip"

export const GmActionButton = ({
  buttonProps,
  b3trBalance,
}: {
  buttonProps: ButtonProps
  b3trBalance?: {
    original: string
    scaled: string
    formatted: string
  }
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { resetModal: resetTransactionModal, onClose: closeTransactionModal } = useTransactionModal()

  // Wallet and user data
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account?.address ?? "")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // GM NFT data
  const { data: maxGMLevel } = useGMMaxLevel()
  const { data: userGms } = useGetUserGMs()
  const selectedGM = userGms?.find(gm => gm.isSelected)
  const isGMOwned = userGms && userGms?.length > 0
  const isMaxGmLevelReached = selectedGM && maxGMLevel === Number(selectedGM.tokenLevel)
  const isEnoughBalanceToUpgradeGM =
    b3trBalance && Number(b3trBalance?.scaled || 0) >= Number(selectedGM?.b3trToUpgrade)

  // Modal controls
  const { isOpen: isMintNftModalOpen, onOpen: onOpenMintNftModal, onClose: onCloseMintNftModal } = useDisclosure()
  const { isOpen: isUpgradeGMModalOpen, onOpen: onOpenUpgradeGMModal, onClose: onCloseUpgradeGMModal } = useDisclosure()

  // Mint NFT handlers
  const handleMintSuccess = useCallback(() => {
    onOpenMintNftModal()
    closeTransactionModal()
  }, [onOpenMintNftModal, closeTransactionModal])

  const { sendTransaction: freeMint, resetStatus: resetFreeMintStatus } = useMintNFT({
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Minting your GM NFT..."),
      },
    },
    onFailure: () => {
      resetFreeMintStatus()
    },
    onSuccess: handleMintSuccess,
  })

  const handleMintSuccessClose = useCallback(() => {
    resetFreeMintStatus()
    onCloseMintNftModal()
  }, [resetFreeMintStatus, onCloseMintNftModal])

  const handleMintGM = useCallback(() => {
    freeMint()
  }, [freeMint])

  //Handle Upgrade GM
  const { sendTransaction: upgradeGM } = useUpgradeGM({
    tokenId: selectedGM?.tokenId ?? "",
    b3trToUpgrade: selectedGM?.b3trToUpgrade ?? "",
  })

  const handleUpgradeGM = useCallback(() => {
    upgradeGM()
  }, [upgradeGM])

  // Navigation handlers
  const goToVote = useCallback(() => {
    router.push(`/rounds/${currentRoundId}/vote`)
  }, [currentRoundId, router])

  // Action click handlers
  const handleOnUpgrade = useCallback(() => {
    resetTransactionModal()
    onOpenUpgradeGMModal()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.UPGRADING_NOW))
  }, [onOpenUpgradeGMModal, resetTransactionModal])

  // Button rendering logic
  const actionButton = useMemo(() => {
    // Case 1: User hasn't voted and doesn't own GM NFT
    if (!hasUserVoted && !isGMOwned) {
      return (
        <Button {...buttonProps} onClick={goToVote}>
          {t("Vote now!")}
        </Button>
      )
    }

    // Case 2: User doesn't own GM NFT
    if (!isGMOwned) {
      return (
        <Button {...buttonProps} onClick={handleMintGM}>
          {t("Mint now!")}
        </Button>
      )
    }

    // Case 3: Max GM level reached
    if (isMaxGmLevelReached) {
      return (
        <HStack bg={"#ffffff4a"} alignSelf="start" rounded="8px" px={5} py={1} gap={1} justify="center">
          <Text
            bg={"linear-gradient(135deg, #a8e5ff -2.65%, #8bff3b 98.11%)"}
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            fontSize={"lg"}
            fontWeight={"bold"}
            noOfLines={1}>
            {t("Max Level Reached!")}
          </Text>
        </HStack>
      )
    }

    // Default case: Upgrade GM
    return (
      <BaseTooltip
        placement="top"
        showTooltip={!isEnoughBalanceToUpgradeGM || isMaxGmLevelReached}
        text={t("Not enough balance to upgrade your GM NFT to the next level.")}>
        <span>
          <Button
            {...buttonProps}
            isDisabled={!isEnoughBalanceToUpgradeGM || isMaxGmLevelReached}
            onClick={handleOnUpgrade}>
            {t("Upgrade now!")}
          </Button>
        </span>
      </BaseTooltip>
    )
  }, [
    buttonProps,
    goToVote,
    handleMintGM,
    handleOnUpgrade,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMOwned,
    isMaxGmLevelReached,
    t,
  ])

  return (
    <>
      {actionButton}
      <MintNFTModal isOpen={isMintNftModalOpen} onClose={handleMintSuccessClose} tokenID={selectedGM?.tokenId} />
      <UpgradeGMModal
        gmLevel={selectedGM?.tokenLevel ?? ""}
        tokenId={selectedGM?.tokenId ?? ""}
        b3trToUpgradeGMToNextLevel={selectedGM?.b3trToUpgrade ?? ""}
        isOpen={isUpgradeGMModalOpen}
        onClose={onCloseUpgradeGMModal}
        sendTransaction={handleUpgradeGM}
      />
    </>
  )
}
