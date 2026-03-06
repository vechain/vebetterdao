"use client"
import { Box, Icon, Text, Heading, VStack, useDisclosure, HStack, Skeleton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Trans, useTranslation } from "react-i18next"

import { BaseBottomSheet } from "@/components/BaseBottomSheet"

import { useAllocationAmount } from "../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { B3TRIcon } from "../../components/Icons/B3TRIcon"
import { DashboardAllocationRounds } from "../proposals/components/components/DashboardAllocationRounds"
import { useRoundProposals } from "../proposals/hooks/useRoundProposals"

export const RoundInfoBottomSheet = () => {
  const { t } = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { allocationRound, roundLoading } = useRoundProposals(currentRoundId ?? "")
  const { data: amounts, isLoading: amountsLoading } = useAllocationAmount(currentRoundId)

  const totalAmount =
    Number(amounts?.treasury ?? 0) +
    Number(amounts?.voteX2Earn ?? 0) +
    Number(amounts?.voteXAllocations ?? 0) +
    Number(amounts?.gm ?? 0)
  const isCardLoading = roundLoading || currentRoundIdLoading

  return (
    <>
      {!isOpen && (
        <HStack
          w="full"
          justify={"space-between"}
          onClick={onOpen}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="brand.secondary"
          color="white"
          py={5}
          px={4}
          borderTopRadius="20px"
          boxShadow="0px -5px 16px 0px #0000000F"
          cursor="pointer"
          zIndex={10}>
          <Box>
            <Skeleton loading={isCardLoading}>
              <Heading size={"xl"} color="black" fontWeight="normal">
                <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: allocationRound.roundId }} t={t} />
              </Heading>
            </Skeleton>
            <Skeleton loading={isCardLoading}>
              <Text textStyle={"sm"} color="black">
                {t("{{from}} to {{to}}", {
                  from: allocationRound.voteStartTimestamp?.format("MMM D"),
                  to: allocationRound.voteEndTimestamp?.format("MMM D"),
                })}
              </Text>
            </Skeleton>
          </Box>
          <VStack align="flex-end" gap={0}>
            <HStack gap={1} align="center">
              <Icon as={B3TRIcon} boxSize={"30px"} rounded="5px" />

              <Skeleton loading={amountsLoading}>
                <Heading size="xl" color="black">
                  {getCompactFormatter(2).format(totalAmount)}
                </Heading>
              </Skeleton>
            </HStack>
            <Text textStyle="sm" color="black">
              {t("Total to distribute")}
            </Text>
          </VStack>
        </HStack>
      )}

      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        minHeight="85dvh"
        ariaTitle={t("Round #{{round}}", { round: allocationRound.roundId })}
        ariaDescription={t("Round #{{round}}", { round: allocationRound.roundId })}>
        <DashboardAllocationRounds isBottomSheet />
      </BaseBottomSheet>
    </>
  )
}
