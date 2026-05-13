import { HStack, Icon, List, Skeleton, Stack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuCircleDashed } from "react-icons/lu"

import { useUserScore } from "../../../api/indexer/sustainability/useUserScore"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"

type Props = {
  isPerson?: boolean
}

/**
 * Three-step onboarding checklist shared by the OnboardingPhaseCard (and surfaces that open from
 * it, like DoActionModal and VotingQualification). The steps mirror the journey to becoming an
 * eligible voter NEXT round:
 *   1. Complete Better Actions (sources isPerson + missingActions/totalActions from useUserScore)
 *   2. Power up B3TR → VOT3 (checked against current VOT3 balance — any amount counts as "yes,
 *      they've performed at least one power-up")
 *   3. Hold at least 1 VOT3 before the NEXT round starts. The check is the user's CURRENT VOT3
 *      balance: whatever they hold now will be locked in at next round's snapshot, so the
 *      live balance is the right forward-looking signal here (not the current round's snapshot).
 */
export const VotingRequirementsList = ({ isPerson }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { missingActions, totalActions, doneActions, isLoading: isLoadingMissingActions } = useUserScore()
  const { data: voteBalance, isLoading: isLoadingVoteBalance } = useGetVot3Balance(account?.address)

  const hasEnoughActions = isPerson ?? missingActions <= 0
  const hasAnyVot3 = !!voteBalance?.original && Number(voteBalance.original) > 0
  const holdsAtLeastOneVot3 = Number(voteBalance?.scaled ?? "0") >= 1

  return (
    <Skeleton loading={isLoadingMissingActions || isLoadingVoteBalance}>
      <List.Root variant="plain" gap="2">
        <Step
          isComplete={hasEnoughActions}
          label={t("Complete {{total}} Better Actions in our apps ({{done}}/{{total}} completed)", {
            total: Math.max(totalActions, 1),
            done: Math.min(doneActions, Math.max(totalActions, 1)),
          })}
        />
        <Step isComplete={hasAnyVot3} label={t("Power up your B3TR into VOT3")} />
        <Step isComplete={holdsAtLeastOneVot3} label={t("Hold at least 1 VOT3 before next round start")} />
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
