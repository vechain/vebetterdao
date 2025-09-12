import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { ProposalFormAction } from "@/store"
import { toIPFSURL } from "@/utils"
import { Card, Heading, Alert, Box, VStack } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import "@uiw/react-md-editor/markdown-editor.css"
import MDEditor from "@uiw/react-md-editor"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const metadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))

  const { t } = useTranslation()

  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)

  const actions: ProposalFormAction[] = useMemo(() => {
    try {
      setProposalDecodeError(null)
      return getActionsFromTargetsAndCalldatas(
        proposal.targets,
        proposal.callDatas,
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
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack gap="4" align="flex-start">
          <Heading size="xl">{t("About the proposal")}</Heading>
          <MDEditor.Markdown
            source={metadata?.data?.markdownDescription}
            style={{
              width: "100%",
              wordBreak: "break-word",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid var(--vbd-colors-border-tertiary)",
              borderColor: "var(--vbd-colors-border-tertiary)",
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
