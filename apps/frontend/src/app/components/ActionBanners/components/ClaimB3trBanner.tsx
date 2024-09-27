import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCurrentAllocationsRoundId, useCurrentRoundReward } from "@/api"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { TransactionModal } from "@/components"
import { useClaimReward } from "@/hooks/useClaimReward"
import { useDisclosure } from "@chakra-ui/react"
import { useCallback } from "react"

const compactFormatter = getCompactFormatter(2)

export const ClaimB3trBanner = () => {
  const { t } = useTranslation()

  const { data: roundId } = useCurrentAllocationsRoundId()
  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const b3trToClaim = compactFormatter.format(rewards)

  const {
    sendTransaction,
    resetStatus,
    error: claimRewardError,
    status: claimRewardsStatus,
    txReceipt,
    sendTransactionTx,
  } = useClaimReward({ roundId: roundId ?? "" })

  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleClaim = useCallback(() => {
    sendTransaction()
    onOpen()
  }, [onOpen, sendTransaction])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [onClose, resetStatus])

  const onTryAgain = useCallback(() => {
    resetStatus()
    handleClaim()
  }, [handleClaim, resetStatus])

  if (isRoundRewardLoading) return null

  return (
    <Card bg="#C8DDFF" borderRadius="xl" w="full">
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
                <Text fontWeight="500">{t("Claim your {{b3trToClaim}} B3TR", { b3trToClaim })}</Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text size="xs" color="#3A5798" fontWeight="600">
                {t("CLAIM YOUR REWARDS")}
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="#0C2D75">
                {t("You have B3TR to claim as rewards for voting in governance")}
              </Heading>
              <Button
                onClick={handleClaim}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500">
                  {t("Claim your {{b3trToClaim}} B3TR", { b3trToClaim })}
                </Text>
              </Button>
            </VStack>
            <Image src="/images/info-bell.png" alt="Pending actions" w={24} h={24} />
          </HStack>
        </Show>
      </CardBody>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={t("Rewards claimed!")}
        status={claimRewardError ? "error" : claimRewardsStatus}
        errorDescription={claimRewardError?.reason}
        errorTitle={claimRewardError ? t("Error claiming") : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={t("Claiming rewards...")}
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        isClaimingRewards
      />
    </Card>
  )
}
