import { Card, CardBody, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalQuorumStatus } from "./components/ProposalQuorumStatus"
import { ProposalSessionVot3 } from "./components/ProposalSessionVot3"
import { ProposalTimeline } from "./components/ProposalTimeline"

export const ProposalSessionSection = () => {
  const { t } = useTranslation()
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Session information")}
          </Heading>
          <ProposalQuorumStatus />
          <ProposalSessionVot3 />
          <ProposalTimeline />
        </VStack>
      </CardBody>
    </Card>
  )
}
