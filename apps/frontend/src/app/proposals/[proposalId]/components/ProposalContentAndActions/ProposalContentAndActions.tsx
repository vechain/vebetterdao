import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { toIPFSURL } from "@/utils"
import { Card, CardBody, VStack, Divider, Heading } from "@chakra-ui/react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useMemo } from "react"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const metadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))

  //   const actions = useMemo(() => {

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start" divider={<Divider />}>
          <Heading size="lg">About the proposal</Heading>
          <MarkdownPreview
            source={metadata?.data?.markdownDescription}
            style={{
              padding: "1rem",
            }}
          />
          {/* {!!proposal.act && (
              <NewProposalForm
                renderTitle={false}
                renderDescription={false}
                isDisabled={true}
                actions={actions}
              />
            )} */}
        </VStack>
      </CardBody>
    </Card>
  )
}
