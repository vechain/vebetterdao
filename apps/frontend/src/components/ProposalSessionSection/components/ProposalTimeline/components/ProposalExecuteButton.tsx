import { useProposalOperationState } from "@/api/contracts/governance/hooks/useProposalOperationState"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { useExecuteProposal } from "@/hooks/useExecuteProposal"
import { timestampToTimeLeft } from "@/utils"
import { Box, Button, Text } from "@chakra-ui/react"
import { t } from "i18next"
import { useCallback, useEffect, useState } from "react"

export const ProposalExecuteButton = () => {
  const [_, setSeconds] = useState(0)
  const { proposal } = useProposalDetail()
  const executeMutation = useExecuteProposal({ proposalId: proposal.id })
  const executeProposal = useCallback(() => {
    executeMutation.sendTransaction()
  }, [executeMutation])

  const { isLoading, isOperationDone, isOperationWaiting, readyTimestamp } = useProposalOperationState(proposal.id)

  useEffect(() => {
    if (isOperationWaiting) {
      const interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isOperationWaiting])

  if (isOperationDone || isLoading) {
    return null
  }
  if (isOperationWaiting) {
    return (
      <Text color="orange" my={2} fontSize={"14px"}>
        {t("Executable in {{timestamp}}", {
          timestamp: timestampToTimeLeft(readyTimestamp * 1000),
        })}
      </Text>
    )
  }
  return (
    <Box>
      <Button my="2" onClick={executeProposal} variant={"primaryAction"}>
        {t("Execute Proposal")}
      </Button>
    </Box>
  )
}
