import { useCallback, useMemo } from "react"
import { Button, ButtonProps, useDisclosure } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useMintNFT } from "@/hooks"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { UpgradeGMModal } from "@/app/apps/components/UpgradeGMModal"
import { useCurrentAllocationsRoundId, useParticipatedInGovernance, useSelectedGmNft, useXNode } from "@/api"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"
import { MintNFTModal } from "./MintNFTModal"
import { FeatureFlagWrapper } from "./FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"

export const GmActionButton = ({ buttonProps }: { buttonProps: ButtonProps }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const {
    isGMOwned,
    isEnoughBalanceToUpgradeGM,

    gmId,
    isMaxGmLevelReached,
    b3trToUpgradeGMToNextLevel,
  } = useSelectedGmNft()
  const { isXNodeHolder, isXNodeDelegator, isXNodeAttachedToGM } = useXNode()

  const router = useRouter()
  const mintNftModal = useDisclosure()
  const {
    sendTransaction: freeMint,
    resetStatus: resetFreeMintStatus,
    isTxReceiptLoading,
    sendTransactionPending,
  } = useMintNFT({
    onFailure: () => {
      mintNftModal.onClose()
      resetFreeMintStatus()
    },
  })

  const handleMintGM = useCallback(() => {
    freeMint({})
    mintNftModal.onOpen()
  }, [freeMint, mintNftModal])

  const attachGmToXNodeModal = useDisclosure()

  const goToVote = useCallback(() => {
    router.push(`/rounds/${currentRoundId}/vote`)
  }, [currentRoundId, router])

  const upgradeGMModal = useDisclosure()

  const actionButton = useMemo(() => {
    if (!hasUserVoted && !isGMOwned) {
      return (
        <Button {...buttonProps} onClick={goToVote}>
          {t("Vote now!")}
        </Button>
      )
    }
    if (!isGMOwned) {
      return (
        <Button {...buttonProps} onClick={handleMintGM}>
          {t("Mint now!")}
        </Button>
      )
    }
    if (isXNodeHolder && !isXNodeAttachedToGM && !isXNodeDelegator) {
      return (
        <FeatureFlagWrapper
          feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
          fallback={
            <Button {...buttonProps} isDisabled={true}>
              {t("Coming soon!")}
            </Button>
          }>
          <Button {...buttonProps} onClick={attachGmToXNodeModal.onOpen}>
            {t("Attach and Upgrade!")}
          </Button>
        </FeatureFlagWrapper>
      )
    }

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
          onClick={upgradeGMModal.onOpen}>
          {t("Upgrade now!")}
        </Button>
      </FeatureFlagWrapper>
    )
  }, [
    attachGmToXNodeModal.onOpen,
    buttonProps,
    goToVote,
    handleMintGM,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMOwned,
    isMaxGmLevelReached,
    isXNodeAttachedToGM,
    isXNodeHolder,
    t,
    upgradeGMModal.onOpen,
    isXNodeDelegator,
  ])

  return (
    <>
      {actionButton}
      <MintNFTModal
        mintNftModal={mintNftModal}
        isTxReceiptLoading={isTxReceiptLoading}
        sendTransactionPending={sendTransactionPending}
      />
      <AttachGMToXNodeModal isOpen={attachGmToXNodeModal.isOpen} onClose={attachGmToXNodeModal.onClose} />
      <UpgradeGMModal
        tokenId={gmId}
        upgradeGMModal={upgradeGMModal}
        b3trToUpgradeGMToNextLevel={b3trToUpgradeGMToNextLevel}
      />
    </>
  )
}
