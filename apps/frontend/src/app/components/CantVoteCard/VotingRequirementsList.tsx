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
 * Uses isPerson from the contract (checked at snapshot) as source of truth for the actions check.
 * missingActions from the indexer is only used as guidance for how many more actions are needed.
 *
 * Token-related checks use the user's CURRENT balances (not the snapshot balances) on purpose —
 * the list is forward-looking advice, so current balance is the right signal.
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
        <Step isComplete={holdsAtLeastOneVot3} label={t("Hold at least 1 VOT3")} />
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
