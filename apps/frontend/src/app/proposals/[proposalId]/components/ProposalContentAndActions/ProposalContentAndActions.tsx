import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { NewProposalForm } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { ProposalFormAction } from "@/store/useProposalFormStore"
import { toIPFSURL } from "@/utils"
import {
  Card,
  CardBody,
  VStack,
  Divider,
  Heading,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  Box,
} from "@chakra-ui/react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useMemo, useState } from "react"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const metadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))

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
          <Heading size="lg">About the proposal</Heading>
          <MarkdownPreview
            source={metadata?.data?.markdownDescription}
            style={{
              padding: "1rem",
              width: "100%",
            }}
          />
          {proposalDecodeError && (
            <Alert status="error" borderRadius={"lg"}>
              <AlertIcon />
              <Box>
                <AlertTitle>Error decoding the proposal calldatas</AlertTitle>
                <AlertDescription>{proposalDecodeError}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!!actions.length && (
            <NewProposalForm renderTitle={false} renderDescription={false} isDisabled={true} actions={actions} />
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
