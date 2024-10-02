import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import { UilGift } from "@iconscout/react-unicons"
import { TransactionModal } from "@/components"
import { useDisclosure } from "@chakra-ui/react"
import { useCallback } from "react"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { useWallet } from "@vechain/dapp-kit-react"

export const ClaimVotingRewardsBanner = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const roundsRewardsQuery = useVotingRewards(currentRoundId, account ?? undefined)

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

  if (roundsRewardsQuery.data?.total !== 0) return null

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
      <Card bg="#C8DDFF" borderRadius="xl" w="full" h="full">
        <CardBody position="relative" overflow="hidden" borderRadius="xl">
          <Image
            src="/images/cloud-background.png"
            alt="cloud-background"
            position="absolute"
            right={["-50%", "-50%", "-10%"]}
            top={["-50%", "-50%", "-150%"]}
          />
          <Show above="md">
            <HStack align="stretch" zIndex={1} position="relative" w="full">
              <Image src="/images/claim-b3tr-icon.png" alt="Claim B3TR" w={24} h={24} />
              <HStack flex={1}>
                <VStack gap={2} align="stretch" flex={1}>
                  <Text size="xs" color="#3A5798" fontWeight="600">
                    {t("CLAIM YOUR REWARDS")}
                  </Text>
                  <Heading fontSize="lg" fontWeight="700" color="#0C2D75">
                    {t("You have B3TR to claim as rewards for voting in governance")}
                  </Heading>
                </VStack>
                <Button
                  variant="primaryAction"
                  onClick={handleClaim}
                  borderRadius="full"
                  leftIcon={<UilGift color="white" />}>
                  <Text fontWeight="500">
                    {t("Claim your {{b3trToClaim}} B3TR", { b3trToClaim: roundsRewardsQuery.data?.totalFormatted })}
                  </Text>
                </Button>
              </HStack>
            </HStack>
          </Show>
          <Show below="md">
            <HStack align="stretch" zIndex={1} position="relative" h="full">
              <VStack gap={2} align="stretch" justify={"space-between"}>
                <Text size="xs" color="#3A5798" fontWeight="600">
                  {t("CLAIM YOUR REWARDS")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#0C2D75">
                  {t("You have B3TR to claim as rewards for voting in governance")}
                </Heading>
                <Button
                  variant="primaryAction"
                  onClick={handleClaim}
                  borderRadius="full"
                  leftIcon={<UilGift color="white" />}>
                  <Text fontWeight="500">
                    {t("Claim your {{b3trToClaim}} B3TR", { b3trToClaim: roundsRewardsQuery.data?.totalFormatted })}
                  </Text>
                </Button>
              </VStack>
              <Image src="/images/claim-b3tr-icon.png" alt="Claim B3TR" w={24} h={24} />
            </HStack>
          </Show>
        </CardBody>
      </Card>
    </>
  )
}
