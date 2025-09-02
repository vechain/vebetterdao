import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { ProposalFormAction } from "@/store"
import { Card, Alert, Box, VStack } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import "@uiw/react-md-editor/markdown-editor.css"
import MDEditor from "@uiw/react-md-editor"
import { FormattedProposalDetailData } from "../../hooks/useProposalDetail"

type Props = {
  proposal: ProposalEnriched | (GrantProposalEnriched & FormattedProposalDetailData)
}

export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const { t } = useTranslation()

  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)

  const actions: ProposalFormAction[] = useMemo(() => {
    try {
      setProposalDecodeError(null)
      return getActionsFromTargetsAndCalldatas(
        proposal.targets as string[],
        proposal.calldatas as string[],
        GovernanceFeaturedContractsWithFunctions,
      )
    } catch (e: unknown) {
      if (e instanceof Error) setProposalDecodeError(e.message)
      else {
        setProposalDecodeError("Error decoding proposal")
      }
      return []
    }
  }, [proposal])

  return (
    <Card.Root w="full" variant="baseWithBorder">
      <Card.Body py={8}>
        <VStack gap={8} align="flex-start">
          <MDEditor.Markdown
            source={proposal.markdownDescription}
            style={{
              width: "100%",
              wordBreak: "break-word",
              borderRadius: "12px",
              backgroundColor: "contrast-on-dark-bg",
              color: "contrast-bg-strong-hover",
              padding: "20px",
              border: "1px solid #D5D5D5",
            }}
          />
          {proposalDecodeError && (
            <Alert.Root status="error" borderRadius={"lg"}>
              <Alert.Indicator />
              <Box>
                <Alert.Title>{t("Error decoding the proposal calldatas")}</Alert.Title>
                <Alert.Description>{proposalDecodeError}</Alert.Description>
              </Box>
            </Alert.Root>
          )}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
