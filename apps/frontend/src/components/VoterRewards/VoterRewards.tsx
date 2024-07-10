import { useAllocationsRoundsEvents, useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import { Card, CardBody, Heading, VStack, Text, Button, Box, Image, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import React, { useCallback, useMemo } from "react"
import BigNumber from "bignumber.js"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { B3TRIcon } from "../Icons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { TransactionModal } from "../TransactionModal"
import { Trans, useTranslation } from "react-i18next"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

export const VoterRewards: React.FC = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const rewardsPerRound = useVotingRewards(currentRoundId, account ?? undefined)
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  const { isOpen, onClose, onOpen } = useDisclosure()

  const roundRewards = useMemo(() => {
    if (!rewardsPerRound) return []

    return rewardsPerRound.map(reward => {
      return {
        roundId: reward.data?.roundId ?? "",
        rewards: reward.data?.rewards ?? "0",
      }
    })
  }, [rewardsPerRound])

  const totalRewards = useMemo(() => {
    if (!rewardsPerRound) return new BigNumber("0")

    return rewardsPerRound.reduce((acc, reward) => acc.plus(reward.data?.rewards ?? "0"), new BigNumber("0"))
  }, [rewardsPerRound])

  const totalRewardsFormatted = useMemo(() => {
    if (!totalRewards) return "0"

    return totalRewards.decimalPlaces(DECIMAL_PLACES, BigNumber.ROUND_DOWN).toString()
  }, [totalRewards])

  const claimRewardsMutation = useClaimRewards({
    roundRewards,
  })

  const handleClaim = useCallback(() => {
    claimRewardsMutation.sendTransaction()
    onOpen()
  }, [claimRewardsMutation, onOpen])

  const isClaimRewardsLoading = claimRewardsMutation.isTxReceiptLoading || claimRewardsMutation.sendTransactionPending

  const handleClose = useCallback(() => {
    claimRewardsMutation.resetStatus()
    onClose()
  }, [claimRewardsMutation, onClose])

  const onTryAgain = useCallback(() => {
    claimRewardsMutation.resetStatus()
    handleClaim()
  }, [claimRewardsMutation, handleClaim])

  if (allocationRoundsEvents?.created.length === 0) return null

  return (
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Rewards claimed!"}
        status={claimRewardsMutation.error ? "error" : claimRewardsMutation.status}
        errorDescription={claimRewardsMutation.error?.reason}
        errorTitle={claimRewardsMutation.error ? "Error claiming" : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle="Claiming rewards..."
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={claimRewardsMutation.txReceipt?.meta.txID ?? claimRewardsMutation.sendTransactionTx?.txid}
        isClaimingRewards
      />
      <Card w="full" variant="baseWithBorder" overflow={"hidden"}>
        <CardBody p={6} pos="relative">
          <Image
            transform={{ rotate: "180deg" }}
            src="/images/voter-rewards-bg.svg"
            alt="Rewards background"
            pos="absolute"
            right={"-18%"}
            top={0}
            zIndex={1}
            boxSize={"full"}
            w="full"
          />
          <VStack spacing={4} w="full" align={"flex-start"}>
            <B3TRIcon boxSize={"56px"} colorVariant="dark" zIndex={2} />

            <Box zIndex={2} w="60%">
              <Heading fontSize="24px" zIndex={2}>
                {t("Voting rewards")}
              </Heading>
              <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"} mt={1} zIndex={2}>
                <Trans
                  i18nKey="You have {{value}} B3TR rewards pending claim."
                  t={t}
                  values={{
                    value: compactFormatter.format(Number(totalRewardsFormatted)),
                  }}
                />
              </Text>
            </Box>

            <Button
              zIndex={2}
              mt={2}
              isDisabled={totalRewards?.eq(0)}
              isLoading={isClaimRewardsLoading}
              onClick={handleClaim}
              variant={"primaryAction"}
              borderRadius={"full"}
              w={"full"}>
              {t("Claim rewards")}
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}
