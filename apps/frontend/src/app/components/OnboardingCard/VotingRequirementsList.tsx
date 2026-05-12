import { HStack, Icon, List, Skeleton, Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuCircleDashed } from "react-icons/lu"

import { useVotingPowerAtSnapshot } from "../../../api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useUserScore } from "../../../api/indexer/sustainability/useUserScore"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"

type Props = {
  isPerson?: boolean
}

/**
 * Three-step onboarding checklist shared by the OnboardingPhaseCard (and surfaces that open from
 * it, like DoActionModal and VotingQualification). The steps mirror the journey to becoming an
 * eligible voter:
 *   1. Complete Better Actions (sources isPerson + missingActions/totalActions from useUserScore)
 *   2. Power up B3TR → VOT3 (checked against current VOT3 balance — any amount counts as "yes,
 *      they've performed at least one power-up")
 *   3. Hold at least 1 VOT3 at the current round's snapshot block — this is the binding
 *      requirement the voting contract uses, so we read it from useVotingPowerAtSnapshot rather
 *      than the current balance.
 */
export const VotingRequirementsList = ({ isPerson }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { missingActions, totalActions, doneActions, isLoading: isLoadingMissingActions } = useUserScore()
  const { data: voteBalance, isLoading: isLoadingVoteBalance } = useGetVot3Balance(account?.address)
  const { vot3Balance: snapshotVot3, isLoading: isLoadingSnapshot } = useVotingPowerAtSnapshot()

  const hasEnoughActions = isPerson ?? missingActions <= 0
  const hasAnyVot3 = !!voteBalance?.original && Number(voteBalance.original) > 0
  const heldVot3AtSnapshot = Number(snapshotVot3?.scaled ?? "0") >= 1

  return (
    <Skeleton loading={isLoadingMissingActions || isLoadingVoteBalance || isLoadingSnapshot}>
      <List.Root variant="plain" gap="2">
        <Step
          isComplete={hasEnoughActions}
          label={t("Complete {{total}} Better Actions in our apps ({{done}}/{{total}} completed)", {
            total: Math.max(totalActions, 1),
            done: Math.min(doneActions, Math.max(totalActions, 1)),
          })}
        />
        <Step isComplete={hasAnyVot3} label={t("Power up your B3TR into VOT3")} />
        <Step isComplete={heldVot3AtSnapshot} label={t("Hold at least 1 VOT3 at round start")} />
      </List.Root>
    </Skeleton>
  )
}

type StepProps = {
  isComplete: boolean
  label: string
}
const Step = ({ isComplete, label }: StepProps) => (
  <List.Item>
    <Stack direction="row" align="flex-start" gap="2" w="full">
      <HStack gap="2" align="flex-start" flex="1" minW={0}>
        <Icon asChild color="inherit" boxSize="5" flexShrink={0} mt="0.5">
          {isComplete ? <LuCircleCheck /> : <LuCircleDashed />}
        </Icon>
        <span>{label}</span>
      </HStack>
    </Stack>
  </List.Item>
)
