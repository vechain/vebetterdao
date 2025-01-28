import { useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import { TransactionModal } from "@/components"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { useDisclosure } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { GenericBanner } from "../../Banners/GenericBanner"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(4)

export const ClaimVotingRewardsBanner = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const roundsRewardsQuery = useVotingRewards(currentRoundId, account?.address ?? undefined)

  const { isOpen, onClose, onOpen } = useDisclosure()

  const claimRewardsMutation = useClaimRewards({
    roundRewards: roundsRewardsQuery.data?.roundsRewards ?? [],
  })

  const handleClaim = useCallback(() => {
    claimRewardsMutation.sendTransaction()
    onOpen()
  }, [claimRewardsMutation, onOpen])

  const handleClose = useCallback(() => {
    claimRewardsMutation.resetStatus()
    onClose()
  }, [claimRewardsMutation, onClose])

  const onTryAgain = useCallback(() => {
    claimRewardsMutation.resetStatus()
    handleClaim()
  }, [claimRewardsMutation, handleClaim])

  return (
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={t("Rewards claimed!")}
        status={claimRewardsMutation.error ? "error" : claimRewardsMutation.status}
        errorDescription={claimRewardsMutation.error?.reason}
        errorTitle={claimRewardsMutation.error ? t("Error claiming") : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={t("Claiming rewards...")}
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={claimRewardsMutation.txReceipt?.meta.txID ?? claimRewardsMutation.sendTransactionTx?.txid}
        isClaimingRewards
      />
      <GenericBanner
        title={t("CLAIM YOUR REWARDS NOW! 💰")}
        titleColor="#3A5798"
        description={t("Congratulations! You have B3TR to claim for casting your vote in governance.")}
        descriptionColor="#0C2D75"
        logoSrc="/images/claim-b3tr-icon.png"
        backgroundColor="#C8DDFF"
        backgroundImageSrc="/images/cloud-background.png"
        buttonLabel={t("Claim your {{b3trToClaim}} B3TR", {
          b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
        })}
        onButtonClick={handleClaim}
        buttonVariant="primaryAction"
        buttonIcon={<UilGift color="white" />}
        buttonIconPosition="left"
      />
    </>
  )
}
