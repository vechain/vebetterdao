import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { VStack, HStack, Heading, Link, Icon, useDisclosure, Grid, Card, GridItem } from "@chakra-ui/react"
import { useMemo } from "react"
import { GrantsStepsCard } from "./GrantsStepCard"
import { GrantsStatsCards } from "./GrantsStatsCards"
import { GrantsProposalCard } from "./GrantsProposalCard"
import { useProposalEnriched } from "@/hooks/proposals/common"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true })
  const { enrichedGrantProposals, totalGrantAmount } = useProposalEnriched()

  const stepsArray = useMemo(
    () => [
      {
        key: GrantsStep.SUBMIT_APPLICATION,
        title: t("How to apply for Grant?"),
        heading: t("1. Submit Grant application"),
        listItems: [
          t(
            "Fill out the form with: project description, funding amount, milestones describing what you'll deliver and when.",
          ),
          t("Once submitted, your Grant proposal becomes visible to the community."),
        ],
        image: "/assets/images/grants/step-1.png",
      },
      {
        key: GrantsStep.GET_SUPPORT,
        title: t("How to apply for Grant?"),
        heading: t("2. Get support from the community"),
        listItems: [
          t("Your Grant needs 3.5M VOT3 deposited within 1 week to move forward."),
          t("If it doesn't reach that , it's cancelled automatically."),
        ],
        image: "/assets/images/grants/step-2.png",
      },
      {
        key: GrantsStep.COMMUNITY_VOTE,
        title: t("How to apply for Grant?"),
        heading: t("3. Get final review from the community"),
        listItems: [
          t("The community express support as Likes, Dislikes and Abstains"),
          t("If the Grant is approved, you will receive funds"),
        ],
        image: "/assets/images/grants/step-3.png",
      },
      {
        key: GrantsStep.RECEIVE_FUNDS,
        title: t("How to apply for Grant?"),
        heading: t("4. Receive funds and start developing"),
        listItems: [
          t("Funds are released milestone by milestone"),
          t("Deliver, get reviewed, unlock the next payment — until you complete the project"),
        ],
        image: "/assets/images/grants/step-4.png",
      },
    ],
    [t],
  )

  return (
    <VStack w="full" spacing={8} pb={8}>
      <HStack
        alignItems="center"
        textAlign="center"
        w="full"
        justifyContent={{ base: "space-between", lg: "flex-start" }}>
        <Heading as="h1" size="xl">
          {t("Grants")}
        </Heading>
        {!isOpen && (
          <Link
            display="inline-flex"
            alignItems="center"
            fontWeight={500}
            gap={1}
            color="primary.500"
            fontSize="md"
            onClick={onOpen}>
            <Icon as={UilInfoCircle} boxSize={4} />
            {t("More info")}
          </Link>
        )}
      </HStack>
      <GrantsStepsCard steps={stepsArray} isOpen={isOpen} onClose={onClose} />
      <GrantsStatsCards
        totalApplications={enrichedGrantProposals.length}
        totalApproved={enrichedGrantProposals.length}
        totalFunds={totalGrantAmount.toNumber()}
      />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Grid templateColumns={{ base: "1fr" }} gap={8} w="full">
            {enrichedGrantProposals &&
              enrichedGrantProposals.map(proposal => (
                <GridItem colSpan={{ base: 1 }} key={proposal.id}>
                  <GrantsProposalCard key={proposal.id} proposal={proposal as ProposalEnriched} />
                </GridItem>
              ))}
          </Grid>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Card w="full" variant="ghost" p={8}></Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}
