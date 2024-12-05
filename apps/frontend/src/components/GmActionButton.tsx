import { useCallback, useMemo } from "react"
import { Button, ButtonProps, useDisclosure, Text, HStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useMintNFT } from "@/hooks"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { UpgradeGMModal } from "@/app/apps/components/UpgradeGMModal"
import {
  getGMLevel,
  useB3trDonated,
  useCurrentAllocationsRoundId,
  useParticipatedInGovernance,
  useSelectedGmNft,
  useXNode,
} from "@/api"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"
import { MintNFTModal } from "./MintNFTModal"
import { FeatureFlagWrapper } from "./FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"
import { xNodeToGMstartingLevel } from "@/constants/gmNfts"

export const GmActionButton = ({ buttonProps }: { buttonProps: ButtonProps }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const {
    isGMOwned,
    isEnoughBalanceToUpgradeGM,
    gmId,
    gmLevel,
    maxGmLevel,
    isMaxGmLevelReached,
    b3trToUpgradeGMToNextLevel,
  } = useSelectedGmNft()
  const { xNodeLevel, isXNodeHolder, isXNodeDelegator, isXNodeAttachedToGM } = useXNode()
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

  const canAttach = useMemo(
    () => isXNodeHolder && !isXNodeDelegator && isGMOwned && !isXNodeAttachedToGM,
    [isXNodeAttachedToGM, isXNodeDelegator, isXNodeHolder, isGMOwned],
  )
  const { data: b3trDonated } = useB3trDonated(gmId)

  const gmStartingLevel = useMemo(() => {
    const gmStartingLevel = xNodeToGMstartingLevel[xNodeLevel]

    return Math.min(gmStartingLevel ?? 1, maxGmLevel ?? 1)
  }, [maxGmLevel, xNodeLevel])

  const levelAfterAttach = useMemo(() => {
    return getGMLevel(gmStartingLevel, Number(b3trDonated ?? 0)) ?? 1
  }, [b3trDonated, gmStartingLevel])

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

    if (canAttach && gmLevel >= levelAfterAttach) {
      return (
        <FeatureFlagWrapper
          feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
          fallback={
            <Button {...buttonProps} isDisabled={true}>
              {t("Coming soon!")}
            </Button>
          }>
          <Button {...buttonProps} onClick={attachGmToXNodeModal.onOpen}>
            {t("Attach now!")}
          </Button>
        </FeatureFlagWrapper>
      )
    }

    if (canAttach && gmLevel < levelAfterAttach) {
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
    hasUserVoted,
    isGMOwned,
    isMaxGmLevelReached,
    canAttach,
    gmLevel,
    levelAfterAttach,
    buttonProps,
    t,
    isEnoughBalanceToUpgradeGM,
    upgradeGMModal.onOpen,
    goToVote,
    handleMintGM,
    attachGmToXNodeModal.onOpen,
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
        gmLevel={gmLevel}
        tokenId={gmId}
        upgradeGMModal={upgradeGMModal}
        b3trToUpgradeGMToNextLevel={b3trToUpgradeGMToNextLevel}
      />
    </>
  )
}
