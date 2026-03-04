import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { UpgradeGMModal } from "@/app/apps/components/UpgradeGMModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { useGetUserGMs } from "../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMMaxLevel } from "../api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { useParticipatedInGovernance } from "../api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../constants/AnalyticsEvents"
import { useMintNFT } from "../hooks/galaxyMember/useMintNFT"
import { useUpgradeGM } from "../hooks/galaxyMember/useUpgradeGM"

import { GetFreeNFTModal } from "./GmNFTAndNodeCard/GetFreeNFTModal"
import { MintNFTModal } from "./MintNFTModal"
import { Tooltip } from "./ui/tooltip"

export const GmActionButton = ({
  b3trBalanceScaled,
  buttonProps,
}: {
  b3trBalanceScaled?: string
  buttonProps: ButtonProps
}) => {
  const { t } = useTranslation()
  const { resetModal: resetTransactionModal } = useTransactionModal()
  // Wallet and user data
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account?.address ?? "")
  // GM NFT data
  const { data: maxGMLevel } = useGMMaxLevel()
  const { data: userGms } = useGetUserGMs()
  const selectedGM = userGms?.find(gm => gm.isSelected)
  const isGMOwned = userGms && userGms?.length > 0
  const isMaxGmLevelReached = selectedGM && maxGMLevel === Number(selectedGM.tokenLevel)
  const isEnoughBalanceToUpgradeGM =
    b3trBalanceScaled && Number(b3trBalanceScaled || 0) >= Number(selectedGM?.b3trToUpgrade)
  // Modal controls
  const { open: isMintNftModalOpen, onOpen: onOpenMintNftModal, onClose: onCloseMintNftModal } = useDisclosure()
  const { open: isUpgradeGMModalOpen, onOpen: onOpenUpgradeGMModal, onClose: onCloseUpgradeGMModal } = useDisclosure()
  const {
    open: isGetFreeNFTModalOpen,
    onOpen: onOpenGetFreeNFTModal,
    onClose: onCloseGetFreeNFTModal,
  } = useDisclosure()

  const { sendTransaction: freeMint, resetStatus: resetFreeMintStatus } = useMintNFT({
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Minting your GM NFT..."),
      },
      success: {
        title: t("GM NFT Minted!"),
        description: t("Your Galaxy Member NFT has been successfully minted. Welcome to the club!"),
        socialDescriptionEncoded:
          "As%20a%20Voter%20in%20VeBetter%2C%20I%E2%80%99ve%20just%20minted%20my%20GM%20Earth%20NFT.%20%F0%9F%8C%8D%0A%0AGet%20yours%20here%20%F0%9F%91%89%20%20https%3A%2F%2Fgovernance.vebetterdao.org%2F%0A%0A%23GalaxyMember%20%23VeBetter",
        onSuccess: onOpenMintNftModal,
      },
    },
    onFailure: () => {
      resetFreeMintStatus()
    },
  })

  const handleMintSuccessClose = useCallback(() => {
    resetFreeMintStatus()
    onCloseMintNftModal()
  }, [resetFreeMintStatus, onCloseMintNftModal])

  const handleMintGM = useCallback(() => {
    onCloseGetFreeNFTModal()
    freeMint()
  }, [freeMint, onCloseGetFreeNFTModal])

  //Handle Upgrade GM
  const { sendTransaction: upgradeGM } = useUpgradeGM({
    tokenId: selectedGM?.tokenId ?? "",
    b3trToUpgrade: selectedGM?.b3trToUpgrade ?? "",
  })

  const handleUpgradeGM = useCallback(() => {
    upgradeGM()
  }, [upgradeGM])

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
        <Button {...buttonProps} asChild>
          <NextLink href="/allocations/vote">{t("Vote now")}</NextLink>
        </Button>
      )
    }

    // Case 2: User doesn't own GM NFT
    if (!isGMOwned) {
      return (
        <Button {...buttonProps} onClick={onOpenGetFreeNFTModal}>
          {t("Get free NFT")}
        </Button>
      )
    }

    // Default case: Upgrade GM
    return (
      <Tooltip
        positioning={{ placement: "bottom" }}
        disabled={!isMaxGmLevelReached && !!isEnoughBalanceToUpgradeGM}
        content={
          isMaxGmLevelReached
            ? t("You have reached the maximum GM NFT level.")
            : t("Not enough balance to upgrade your GM NFT to the next level.")
        }>
        <span>
          <Button
            {...buttonProps}
            disabled={!isEnoughBalanceToUpgradeGM || isMaxGmLevelReached}
            onClick={handleOnUpgrade}>
            {t("Upgrade NFT")}
          </Button>
        </span>
      </Tooltip>
    )
  }, [
    buttonProps,
    handleOnUpgrade,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMOwned,
    isMaxGmLevelReached,
    onOpenGetFreeNFTModal,
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
      <GetFreeNFTModal isOpen={isGetFreeNFTModalOpen} onClose={onCloseGetFreeNFTModal} onCtaClick={handleMintGM} />
    </>
  )
}
