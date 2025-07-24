/* eslint-disable react/no-array-index-key */
import { useTranslation } from "react-i18next"
import { UilInfoCircle, UilThumbsUp, UilThumbsDown } from "@iconscout/react-unicons"
import { VStack, HStack, Heading, Link, Icon, useDisclosure, Grid, Card, GridItem, Button } from "@chakra-ui/react"
import { useMemo } from "react"
import { GrantsStepsCard } from "./GrantsStepCard"
import { GrantsStatsCards } from "./GrantsStatsCards"
import { GrantsProposalCard, ProposalInteractions, Proposal } from "./GrantsProposalCard"
import { ProposalState } from "@/api/contracts/governance"
import { FaRegHeart } from "react-icons/fa6"
import { AbstainedIcon } from "@/components"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}

const communityInteractions: ProposalInteractions = {
  [ProposalState.Pending]: [
    {
      percentage: 100,
      icon: <Icon as={FaRegHeart} />,
    },
  ],
  [ProposalState.Active]: [
    {
      percentage: 80,
      icon: <Icon as={UilThumbsUp} />,
    },
    {
      percentage: 15,
      icon: <Icon as={UilThumbsDown} transform="scaleX(-1)" />,
    },

    {
      percentage: 5,
      icon: <Icon as={() => <AbstainedIcon color="currentColor" />} color="currentColor" />,
    },
  ],
}

const mockProposal: Proposal = {
  id: "111965945612441767232324032544037588349319109273722078697382174199449589178419",
  title: "Comprehensive Redesign and Correction of the VeBetterDAO Ecosystem",
  b3tr: "8,000,000 B3TR",
  dAppGrant: "dApp Grant",
  proposer: {
    profilePicture: "https://via.placeholder.com/150",
    addressOrDomain: "domainname.vet",
  },
  state: ProposalState.Pending,
  phases: {
    [ProposalState.Pending]: {
      startAt: "2025-01-01",
      endAt: "2025-01-01",
    },
    [ProposalState.Active]: {
      startAt: "2025-01-08",
      endAt: "2025-01-15",
    },
  },
  communityInteractions,
}

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true })
  const { sendTransaction: createGrantProposal } = useCreateGrantProposal({
    onSuccess: () => {
      window.alert("Grant proposal created")
    },
  })

  const handleCreateGrantProposal = () => {
    createGrantProposal()
  }
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
      <GrantsStatsCards totalApplications={"1230"} totalApproved={"1230"} totalFunds={"3M B3TR"} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsProposalCard proposal={mockProposal} />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Card w="full" variant="ghost" p={8}></Card>
        </GridItem>
      </Grid>
      <Button onClick={handleCreateGrantProposal}>{"Create Grant Proposal"}</Button>
    </VStack>
  )
}
