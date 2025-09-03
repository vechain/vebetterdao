import { Grid, GridItem, VStack, Text } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions"

import { useMemo } from "react"
import { ProposalType } from "@/hooks/proposals/grants/types"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useTranslation } from "react-i18next"
import { useProposalEnriched } from "@/hooks"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { t } = useTranslation()
  const { data: { proposals } = { proposals: [] }, isLoading } = useProposalEnriched()

  const proposal = useMemo(() => {
    return proposals.find(p => p.id === proposalId)
  }, [proposals, proposalId])

  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  //TODO: Ensure we have a proposal
  if (!proposal) return null

  const BreadcrumItems = [
    {
      label: "Proposals", //TODO: This should be dynamic based on the proposal type like "Grants" or "Proposals"
      href: "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

  const overviewContent = <ProposalContentAndActions proposal={proposal} />

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <PageBreadcrumb items={BreadcrumItems} />

      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]}>
          <ProposalOverview
            overviewContent={overviewContent}
            isGrant={isGrant}
            proposal={proposal}
            isLoading={isLoading}
          />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <VStack align="stretch" gap={8}>
            <Text>{t("proposal")}</Text>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
