import { RoundCreated, useAllocationsRoundsEvents, useVotingPeriod } from "@/api"
import { Card, VStack, HStack, Heading, Radio, Skeleton, Text, CardProps } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useCurrentBlock } from "@vechain/vechain-kit"

const blockTime = getConfig().network.blockTime

type Props = {
  roundId: number | string
  selected: boolean
  onSelect?: () => void
  renderSkeleton?: boolean
  isSelectable?: boolean
  cardProps?: CardProps
}
export const SelectedRoundRadioCard: React.FC<Props> = ({
  roundId,
  selected,
  onSelect,
  renderSkeleton,
  isSelectable = true,
  cardProps = {},
}) => {
  const { t } = useTranslation()
  const { data: allocationRoundEvents } = useAllocationsRoundsEvents()
  const { data: votingPeriod } = useVotingPeriod()

  const { data: currentBlock } = useCurrentBlock()

  const estimatedStartBlock = useMemo(() => {
    if (!allocationRoundEvents?.created.length) return null

    //round already exist
    const roundEvent = allocationRoundEvents.created.find(event => event.roundId === roundId)
    if (roundEvent) return Number(roundEvent.voteStart)

    //future round
    if (!votingPeriod) return null
    const latestRound = allocationRoundEvents.created[allocationRoundEvents.created.length - 1] as RoundCreated

    const roundsBetween = Math.abs(Number(roundId) - Number(latestRound.roundId))
    const blocksBetween = roundsBetween * Number(votingPeriod)
    const estimatedStartBlock = Number(latestRound.voteStart) + blocksBetween
    return estimatedStartBlock
  }, [allocationRoundEvents, roundId, votingPeriod])

  const estimatedStartTime = useMemo(() => {
    if (!estimatedStartBlock || !currentBlock) return null

    const startBlockFromNow = estimatedStartBlock - currentBlock.number

    const durationLeftTimestamp = startBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds")
  }, [currentBlock, estimatedStartBlock])

  const isEstimatedStartTimeLoading = !estimatedStartTime || !currentBlock || !estimatedStartBlock

  return (
    <Card
      data-testid={renderSkeleton ? "round-radio-card-skeleton" : "round-radio-card"}
      w="full"
      onClick={onSelect}
      {...(!renderSkeleton && isSelectable && { cursor: "pointer" })}
      {...((renderSkeleton || !isSelectable) && { pointerEvents: "none" })}
      borderWidth={1}
      borderColor={selected ? "primary.active" : "gray.200"}
      borderRadius="xl"
      {...(selected && {
        boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)",
      })}
      p={6}
      {...(!renderSkeleton &&
        isSelectable && {
          _hover: { borderColor: "primary.active", transition: "border-color 0.2s" },
        })}
      {...cardProps}>
      <VStack spacing={4} align="flex-start">
        <HStack justify="space-between" w="full">
          <VStack spacing={2} align="flex-start">
            <Skeleton isLoaded={!renderSkeleton}>
              <Heading size={["sm", "md"]}>
                {t("Round #{{round}}", {
                  round: roundId,
                })}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!isEstimatedStartTimeLoading}>
              <Text fontSize={["sm", "md"]} as="span" display={"inline-flex"} gap={1}>
                {t("Starts on")}
                <Text fontWeight="600">{estimatedStartTime?.format("MMM D")}</Text>
              </Text>
            </Skeleton>
          </VStack>
          {isSelectable && <Radio isChecked={selected} isDisabled={renderSkeleton} />}
        </HStack>
      </VStack>
    </Card>
  )
}
