import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { ProposalFormAction } from "@/store"
import { toIPFSURL } from "@/utils"
import { Card, CardBody, Heading, Alert, AlertIcon, AlertDescription, AlertTitle, Box, VStack } from "@chakra-ui/react"
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
    <Card w="full" variant="baseWithBorder">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">{t("About the proposal")}</Heading>
          <MDEditor.Markdown
            source={metadata?.data?.markdownDescription}
            style={{
              width: "100%",
            }}
          />
          {proposalDecodeError && (
            <Alert status="error" borderRadius={"lg"}>
              <AlertIcon />
              <Box>
                <AlertTitle>{t("Error decoding the proposal calldatas")}</AlertTitle>
                <AlertDescription>{proposalDecodeError}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
        </VStack>
      </CardBody>
    </Card>
  )
}
