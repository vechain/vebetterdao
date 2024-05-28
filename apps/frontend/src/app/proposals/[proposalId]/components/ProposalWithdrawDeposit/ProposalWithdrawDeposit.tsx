import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { TransactionModal } from "@/components/TransactionModal"
import { useWithdrawDeposit } from "@/hooks/useWithdrawDeposit"
import { Box, Button, Card, Circle, Flex, HStack, Heading, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter()

export const ProposalWithdrawDeposit = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()
  const withdrawMutation = useWithdrawDeposit({
    proposalId: proposal.id,
  })
  const { isOpen, onClose: handleClose, onOpen } = useDisclosure()
  const withdraw = useCallback(() => {
    onOpen()
    withdrawMutation.sendTransaction({})
  }, [onOpen, withdrawMutation])
  return (
    <>
      {withdrawMutation.status !== "ready" && (
        <TransactionModal
          isOpen={isOpen}
          onClose={handleClose}
          successTitle={"Deposit Withdraw Completed!"}
          status={withdrawMutation.error ? "error" : withdrawMutation.status}
          errorDescription={withdrawMutation.error?.reason}
          errorTitle={withdrawMutation.error ? "Error Withdrawing" : undefined}
          pendingTitle="Withdrawing..."
          showExplorerButton
          txId={withdrawMutation.txReceipt?.meta.txID ?? withdrawMutation.sendTransactionTx?.txid}
        />
      )}
      {proposal.state !== ProposalState.Pending &&
        proposal.state !== ProposalState.Active &&
        Number(proposal.yourSupport) > 0 && (
          <Card border={`1px solid #004CFC`} rounded="16px" p="24px" boxShadow={"0px 0px 16px 0px #004CFC59"}>
            <VStack alignItems={"stretch"} gap={6}>
              <HStack justify="space-between">
                <Heading fontSize={"24px"} fontWeight={700}>
                  {t("Community Support")}
                </Heading>
                <UilInfoCircle size="24px" color={"#004CFC"} />
              </HStack>
              <Text fontSize={"14px"}>{t("This round is ended, claim your tokens back.")}</Text>
              <VStack alignItems={"stretch"} gap={4}>
                <HStack alignItems={"baseline"} justify={"space-between"}>
                  <HStack alignItems={"baseline"}>
                    <Flex position="relative" top="7px" display={"inline-flex"}>
                      <Arm color={"#004CFC"} size={"36"} />
                    </Flex>
                    <Text fontSize={"28px"} color={"#252525"} fontWeight={700}>
                      {compactFormatter.format(Number(proposal.communityDeposits))}
                    </Text>
                    <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                      {t("/")}
                    </Text>
                    <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                      {compactFormatter.format(Number(proposal.depositThreshold))}
                    </Text>
                  </HStack>
                  <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"}>
                    {compactFormatter.format(proposal.communityDepositPercentage * 100)}
                    {t("%")}
                  </Text>
                </HStack>
                <Box position="relative">
                  <Box bg="#D5D5D5" h="10px" rounded="full" />
                  <Box
                    bg={"#004CFC"}
                    h="10px"
                    rounded="full"
                    w={`${proposal.communityDepositChartPercentage}%`}
                    position="absolute"
                    top={0}
                    left={0}
                  />
                  <Box
                    bg={"#77A0FF"}
                    h="10px"
                    rounded="full"
                    w={`${proposal.othersSupportChartPercentage}%`}
                    position="absolute"
                    top={0}
                    left={0}
                  />
                </Box>
                <VStack align={"stretch"}>
                  <HStack>
                    <Circle size="12px" bg={"#77A0FF"} />
                    <Text fontSize="14px" fontWeight={400}>
                      {t("From {{users}} users {{vot3}} V3.", {
                        vot3: proposal.othersSupport || 0,
                        users: compactFormatter.format(Number(proposal.othersSupportUserCount)),
                      })}
                    </Text>
                  </HStack>
                  <HStack>
                    <Circle size="12px" bg={"#004CFC"} />
                    <Text fontSize="14px" fontWeight={400}>
                      {t("From you {{vot3}} V3.", { vot3: compactFormatter.format(Number(proposal.yourSupport)) })}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
              <Button onClick={withdraw} variant="primaryAction">
                {t("Claim your tokens back")}
              </Button>
            </VStack>
          </Card>
        )}
    </>
  )
}
