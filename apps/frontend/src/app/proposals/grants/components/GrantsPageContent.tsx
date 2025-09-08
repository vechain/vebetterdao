import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import {
  VStack,
  HStack,
  Heading,
  Link,
  Icon,
  useDisclosure,
  Grid,
  GridItem,
  createListCollection,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { GrantsStepsCard } from "./GrantsStepCard"
import { GrantsStatsCards } from "./GrantsStatsCards"
import { GrantsProposalCard } from "./GrantsProposalCard"
import { useProposalEnriched } from "@/hooks/proposals/common"
import { HowToSupportCard } from "../../components/components"
import { ProposalState, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { useMilestoneClaimedEvents } from "@/hooks/proposals/grants/useMilestoneClaimedEvents"
import BigNumber from "bignumber.js"
import { SelectField, SearchField } from "@/components"
import { useFilteredProposals } from "../../hooks/useFilteredProposals"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  //CONSTANTS
  const filterOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: t("Approval phase"), value: "approval_phase" },
        { label: t("Support phase"), value: "support_phase" },
        { label: t("Supported"), value: "supported" },
        { label: t("Approved"), value: "approved" },
        { label: t("In development"), value: "in_development" },
        { label: t("Completed"), value: "completed" },
        { label: t("Cancelled"), value: "cancelled" },
      ],
    })
  }, [t])
  //Get all the values of the filterOptions as an array
  const defaultValue = filterOptions.items.map(item => item.value)

  //UI HOOKS

  const { open, onOpen, onClose } = useDisclosure({ defaultOpen: true })

  //STATES
  const { selectedFilter, setSelectedFilter } = useProposalFilters()
  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] } } = useProposalEnriched()
  const { filteredProposals } = useFilteredProposals(selectedFilter, enrichedGrantProposals)
  const { data: milestoneClaimedEvents } = useMilestoneClaimedEvents()

  const approvedStates = useMemo(
    () => [ProposalState.Succeeded, ProposalState.InDevelopment, ProposalState.Completed, ProposalState.Executed],
    [],
  )

  //Total grants approved
  const totalGrantsApproved = useMemo(() => {
    return enrichedGrantProposals.filter(proposal => approvedStates.includes(proposal.state)).length
  }, [enrichedGrantProposals, approvedStates])

  //Total distributed amount
  const totalDistributedAmount = useMemo(() => {
    return (
      milestoneClaimedEvents?.reduce((acc, event) => acc.plus(BigNumber(event.amount)), BigNumber(0)) ?? BigNumber(0)
    )
  }, [milestoneClaimedEvents])

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
    <VStack w="full" gap={8} pb={8}>
      <HStack
        alignItems="center"
        textAlign="center"
        w="full"
        justifyContent={{ base: "space-between", lg: "flex-start" }}>
        <Heading size="xl">{t("Grants")}</Heading>
        {!open && (
          <Link
            display="inline-flex"
            alignItems="center"
            fontWeight={500}
            color="primary.500"
            fontSize="md"
            onClick={onOpen}>
            <Icon as={UilInfoCircle} boxSize={4} />
            {t("More info")}
          </Link>
        )}
      </HStack>
      <GrantsStepsCard steps={stepsArray} isOpen={open} onClose={onClose} />
      <GrantsStatsCards
        totalApplications={enrichedGrantProposals?.length || 0}
        totalApproved={totalGrantsApproved}
        totalFunds={totalDistributedAmount.toNumber()}
      />

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <VStack gap={6} alignItems="stretch">
            <HStack justifyContent="space-between" w="full" gap={4}>
              <SearchField /> {/*TODO: Implement search */}
              <SelectField
                placeholder={t("Status")}
                options={filterOptions}
                defaultValue={defaultValue}
                onChange={value => setSelectedFilter(value.map(item => item as ProposalFilter | StateFilter))}
                isMultiOption
              />
            </HStack>
            <Grid templateColumns={{ base: "1fr" }} gap={8} w="full">
              {filteredProposals &&
                filteredProposals?.map(proposal => (
                  <GridItem key={proposal.id}>
                    <GrantsProposalCard
                      key={proposal.id}
                      proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }}
                    />
                  </GridItem>
                ))}
            </Grid>
          </VStack>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <HowToSupportCard />
        </GridItem>
      </Grid>
    </VStack>
  )
}
