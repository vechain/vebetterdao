import { useCallback, useMemo } from "react"
import { Button, ButtonProps, useDisclosure, Text, HStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useB3trDonated, useMintNFT, useUpgradeGM } from "@/hooks"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { UpgradeGMModal } from "@/app/apps/components/UpgradeGMModal"
import {
  getGMLevel,
  useCurrentAllocationsRoundId,
  useParticipatedInGovernance,
  useSelectedGmNft,
  useXNode,
} from "@/api"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { MintNFTModal } from "./MintNFTModal"
import { FeatureFlagWrapper } from "./FeatureFlagWrapper"
import { buttonClickActions, buttonClicked, ButtonClickProperties, FeatureFlag } from "@/constants"
import { xNodeToGMstartingLevel } from "@/constants/gmNfts"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const GmActionButton = ({ buttonProps }: { buttonProps: ButtonProps }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { resetModal: resetTransactionModal, onClose: closeTransactionModal } = useTransactionModal()

  // Wallet and user data
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account?.address ?? "")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // GM NFT data
  const {
    isGMOwned,
    isEnoughBalanceToUpgradeGM,
    gmId,
    gmLevel,
    maxGmLevel,
    isMaxGmLevelReached,
    b3trToUpgradeGMToNextLevel,
  } = useSelectedGmNft()
  const { data: b3trDonated } = useB3trDonated(gmId)

  // X-Node data
  const { xNodeLevel, isXNodeHolder, isXNodeDelegator, isXNodeAttachedToGM } = useXNode()

  // Modal controls
  const { isOpen: isMintNftModalOpen, onOpen: onOpenMintNftModal, onClose: onCloseMintNftModal } = useDisclosure()
  const { isOpen: isUpgradeGMModalOpen, onOpen: onOpenUpgradeGMModal, onClose: onCloseUpgradeGMModal } = useDisclosure()
  const { isOpen: isAttachGMModalOpen, onOpen: onOpenAttachGMModal, onClose: onCloseAttachGMModal } = useDisclosure()

  // Computed values
  const canAttach = useMemo(
    () => isXNodeHolder && !isXNodeDelegator && isGMOwned && !isXNodeAttachedToGM,
    [isXNodeAttachedToGM, isXNodeDelegator, isXNodeHolder, isGMOwned],
  )

  const gmStartingLevel = useMemo(() => {
    const gmStartingLevel = xNodeToGMstartingLevel[xNodeLevel]
    return Math.min(gmStartingLevel ?? 1, maxGmLevel ?? 1)
  }, [maxGmLevel, xNodeLevel])

  const levelAfterAttach = useMemo(() => {
    return getGMLevel(gmStartingLevel, Number(b3trDonated ?? 0)) ?? 1
  }, [b3trDonated, gmStartingLevel])

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
    tokenId: gmId ?? "",
    b3trToUpgrade: String(b3trToUpgradeGMToNextLevel) ?? "",
  })

  const handleUpgradeGM = useCallback(() => {
    upgradeGM()
  }, [upgradeGM])

  // Navigation handlers
  const goToVote = useCallback(() => {
    router.push(`/rounds/${currentRoundId}/vote`)
  }, [currentRoundId, router])

  // Action click handlers
  const handleOnClick = useCallback(
    (action: string) => {
      switch (action) {
        case "UPGRADE_GM":
          resetTransactionModal()
          onOpenUpgradeGMModal()
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.UPGRADING_NOW))
          break
        case "ATTACH_AND_UPGRADE_GM":
          onOpenAttachGMModal()
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.ATTACH_AND_UPGRADE_NOW))
          break
        case "ATTACH_GM":
          onOpenAttachGMModal()
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.ATTACH_NOW))
          break
        default:
          break
      }
    },
    [onOpenAttachGMModal, onOpenUpgradeGMModal, resetTransactionModal],
  )

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

    // Case 4: Can attach GM to X-Node and GM level is >= level after attach
    if (canAttach && gmLevel && Number(gmLevel) >= levelAfterAttach) {
      return (
        <FeatureFlagWrapper
          feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
          fallback={
            <Button {...buttonProps} isDisabled={true}>
              {t("Coming soon!")}
            </Button>
          }>
          <Button {...buttonProps} onClick={() => handleOnClick("ATTACH_GM")}>
            {t("Attach now!")}
          </Button>
        </FeatureFlagWrapper>
      )
    }

    // Case 5: Can attach GM to X-Node and GM level is < level after attach
    if (canAttach && gmLevel && Number(gmLevel) < levelAfterAttach) {
      return (
        <FeatureFlagWrapper
          feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
          fallback={
            <Button {...buttonProps} isDisabled={true}>
              {t("Coming soon!")}
            </Button>
          }>
          <Button {...buttonProps} onClick={() => handleOnClick("ATTACH_AND_UPGRADE_GM")}>
            {t("Attach and Upgrade!")}
          </Button>
        </FeatureFlagWrapper>
      )
    }

    // Default case: Upgrade GM
    return (
      <FeatureFlagWrapper
        feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
        fallback={
          <Button {...buttonProps} isDisabled={true}>
            {t("Coming soon!")}
          </Button>
        }>
        <Button
          {...buttonProps}
          isDisabled={!isEnoughBalanceToUpgradeGM || isMaxGmLevelReached}
          onClick={() => handleOnClick("UPGRADE_GM")}>
          {t("Upgrade now!")}
        </Button>
      </FeatureFlagWrapper>
    )
  }, [
    hasUserVoted,
    isGMOwned,
    isMaxGmLevelReached,
    canAttach,
    gmLevel,
    levelAfterAttach,
    buttonProps,
    t,
    isEnoughBalanceToUpgradeGM,
    goToVote,
    handleMintGM,
    handleOnClick,
  ])

  return (
    <>
      {actionButton}
      <MintNFTModal isOpen={isMintNftModalOpen} onClose={handleMintSuccessClose} tokenID={gmId} />
      <AttachGMToXNodeModal isOpen={isAttachGMModalOpen} onClose={onCloseAttachGMModal} />
      <UpgradeGMModal
        gmLevel={gmLevel ?? ""}
        tokenId={gmId ?? ""}
        b3trToUpgradeGMToNextLevel={String(b3trToUpgradeGMToNextLevel) ?? ""}
        isOpen={isUpgradeGMModalOpen}
        onClose={onCloseUpgradeGMModal}
        sendTransaction={handleUpgradeGM}
      />
    </>
  )
}
