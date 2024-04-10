import { Card, CardBody, CardHeader, Heading, VStack } from "@chakra-ui/react"

import { UpdateProposalThreshold } from "./UpdateProposalThreshold"

export const ProposalsAdmin = () => {
  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">Proposals and Governance</Heading>
      </CardHeader>
      <CardBody>
        <VStack w={"full"} spacing={4} alignItems={"start"}></VStack>
      </CardBody>
    </Card>
  )
}
