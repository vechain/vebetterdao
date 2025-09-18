import { MilestoneItem } from "@/app/proposals/grants/components"
import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { GrantProposalEnriched, MilestoneState } from "@/hooks/proposals/grants/types"
import { useAllMilestoneStates } from "@/hooks/proposals/grants/useAllMilestoneStates"
import { Accordion, Circle, Skeleton, Steps, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { humanNumber } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { Calendar } from "iconoir-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const MilestonesActions = ({ proposal }: { proposal?: GrantProposalEnriched }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { data: milestoneStatesData, isLoading } = useAllMilestoneStates(proposal)
  const { t } = useTranslation()
  const [accordionValue, setAccordionValue] = useState<string[]>([])

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const filteredMilestoneStatesData = useMemo(() => {
    return milestoneStatesData?.filter(item => item.milestone !== undefined) ?? []
  }, [milestoneStatesData])

  const formatDuration = (durationFrom: number, durationTo: number) => {
    const from = dayjs(durationFrom * 1000).format("MMM D, YYYY")
    const to = dayjs(durationTo * 1000).format("MMM D, YYYY")
    return `${from} - ${to}`
  }

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if (filteredMilestoneStatesData.length > 0) {
      const allAccordionValues = filteredMilestoneStatesData.map((_, index) => `milestone-accordion-item-${index}`)
      setAccordionValue(allAccordionValues)
    }
  }, [filteredMilestoneStatesData])

  const currentStep = useMemo(() => {
    const reversedIndex = filteredMilestoneStatesData
      .slice()
      .reverse()
      .findIndex(milestone => milestone.state === MilestoneState.Approved || milestone.state === MilestoneState.Claimed)
    return reversedIndex >= 0 ? filteredMilestoneStatesData.length - 1 - reversedIndex : 0
  }, [filteredMilestoneStatesData])

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Skeleton loading={isLoading}>
      <Steps.Root
        orientation="vertical"
        defaultStep={0}
        count={filteredMilestoneStatesData.length}
        size="sm"
        w="full"
        h="full"
        step={currentStep}
        colorPalette="blue"
        variant="primaryVertical">
        <Steps.List>
          <Accordion.Root
            multiple // allow any item to be open
            value={accordionValue}
            onValueChange={details => setAccordionValue(details.value)}
            w="full">
            {filteredMilestoneStatesData.map((milestone, index) => (
              <Steps.Item
                key={`milestone-step-${milestone.index}`}
                index={index}
                color={index === currentStep ? "text.default" : "text.subtle"}>
                <Steps.Indicator>
                  <Steps.Status
                    incomplete={<Circle bg="actions.primary.default" size="0" />}
                    complete={<Circle bg="actions.primary.default" size="40%" />}
                    current={<Circle bg="actions.primary.default" size="55%" />}
                  />
                </Steps.Indicator>
                <Steps.Separator />
                <VStack pb={"24px"} align="flex-start">
                  <Accordion.Item value={`milestone-accordion-item-${index}`} border="none" w="full">
                    {/* Milestone header */}
                    <VStack align="flex-start" gap={"16px"} pb={"16px"}>
                      <Accordion.ItemTrigger py={1}>
                        <Text fontSize="lg" fontWeight={"semibold"}>
                          {t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}
                        </Text>
                      </Accordion.ItemTrigger>
                    </VStack>
                    <Accordion.ItemContent>
                      <VStack align="flex-start" gap={"16px"} h="full">
                        <MilestoneItem
                          index={index}
                          icon={B3trIcon}
                          title={t("Amount to grant")}
                          value={humanNumber(
                            milestone.milestone?.fundingAmount ?? 0,
                            milestone.milestone?.fundingAmount ?? 0,
                            "B3TR",
                          )}
                        />
                        <MilestoneItem
                          index={index}
                          icon={Calendar}
                          title={t("Duration")}
                          value={formatDuration(
                            milestone.milestone?.durationFrom ?? 0,
                            milestone.milestone?.durationTo ?? 0,
                          )}
                        />
                        <MilestoneItem
                          index={index}
                          icon={UilInfoCircle}
                          title={t("Description")}
                          value={milestone.milestone?.description ?? ""}
                        />
                      </VStack>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                </VStack>
              </Steps.Item>
            ))}
          </Accordion.Root>
        </Steps.List>
      </Steps.Root>
    </Skeleton>
  )
}

// TODO: Reject will be on the right side as cancel proposal
//   const handleRejectGrant = () => {
//     rejectGrant()
//   }
//   <Button variant="primaryAction" disabled={!permissions?.isGrantRejector} onClick={handleRejectGrant}>
//   {"Reject Grant"}
// </Button>
// const { sendTransaction: rejectGrant } = useRejectGrant({
//   proposalId: proposal.id,
//   onSuccess: () => {
//     queryClient.invalidateQueries({ queryKey: getProposalStateQueryKey(proposal.id) })
//   },
// })

//  <Button variant="primaryAction" disabled={!permissions?.isGrantRejector} onClick={handleRejectGrant}>
// {"Reject Grant"}
// </Button>
