import { ConvertModal, MobileFilterDrawer, SearchField, SelectField } from "@/components"
import {
  GrantProposalEnriched,
  ProposalState,
  useBreakpoints,
  useDebounce,
  useMilestoneClaimedEvents,
  useProposalEnriched,
  useProposalSearch,
} from "@/hooks"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"
import {
  createListCollection,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Link,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
  Button,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import BigNumber from "bignumber.js"
import { useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useWallet } from "@vechain/vechain-kit"

import { HowToSupportCard } from "../../components/components"
import { useFilteredProposals } from "../../hooks/useFilteredProposals"
import { GrantsBanners } from "./Banner/GrantsBanners"
import { GrantsProposalCard } from "./GrantsProposalCard"
import { GrantsStatsCards } from "./GrantsStatsCards"
import { GrantsStepsCard } from "./GrantsStepCard"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { ProposalType } from "@/types"

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  //CONSTANTS
  const filterOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: t("Approval phase"), value: StateFilter.Active },
        { label: t("Support phase"), value: ProposalFilter.LookingForSupport },
        { label: t("Supported"), value: ProposalFilter.UpcomingVoting },
        { label: t("Approved"), value: StateFilter.Succeeded },
        { label: t("In development"), value: StateFilter.InDevelopment },
        { label: t("Completed"), value: StateFilter.Completed },
        { label: t("Cancelled"), value: StateFilter.Canceled },
      ],
    })
  }, [t])
  const filterDefaultValues = filterOptions.items.map(item => item.value)
  const stepsArray = [
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
      image: "/assets/images/grants/step-1.webp",
    },
    {
      key: GrantsStep.GET_SUPPORT,
      title: t("How to apply for Grant?"),
      heading: t("2. Get support from the community"),
      listItems: [
        t("Your Grant needs 3.5M VOT3 deposited within 1 week to move forward."),
        t("If it doesn't reach that , it's cancelled automatically."),
      ],
      image: "/assets/images/grants/step-2.webp",
    },
    {
      key: GrantsStep.COMMUNITY_VOTE,
      title: t("How to apply for Grant?"),
      heading: t("3. Get final review from the community"),
      listItems: [
        t("The community express support as Likes, Dislikes and Abstains"),
        t("If the Grant is approved, you will receive funds"),
      ],
      image: "/assets/images/grants/step-3.webp",
    },
    {
      key: GrantsStep.RECEIVE_FUNDS,
      title: t("How to apply for Grant?"),
      heading: t("4. Receive funds and start developing"),
      listItems: [
        t("Funds are released milestone by milestone"),
        t("Deliver, get reviewed, unlock the next payment — until you complete the project"),
      ],
      image: "/assets/images/grants/step-4.webp",
    },
  ]

  //UI HOOKS
  const { isMobile } = useBreakpoints()
  const desktopStepCardDisclosure = useDisclosure({ defaultOpen: true })
  const mobileStepCardDisclosure = useDisclosure({ defaultOpen: false })
  const { open, onOpen, onClose } = isMobile ? mobileStepCardDisclosure : desktopStepCardDisclosure
  const { open: isOpenConvertModal, onClose: onCloseConvertModal, onOpen: onOpenConvertModal } = useDisclosure()
  // LOGIC HOOKS
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const hasMetProposalCriteria = useMetProposalCriteria(ProposalType.GRANT)

  const { selectedFilter, setSelectedFilter } = useProposalFilters()
  const {
    data: { enrichedGrantProposals } = { enrichedGrantProposals: [] },
    isLoading: isLoadingEnrichedGrantProposals,
  } = useProposalEnriched()
  const searchedProposals = useProposalSearch(enrichedGrantProposals, debouncedSearchTerm)
  const { filteredProposals } = useFilteredProposals(selectedFilter, searchedProposals)
  const { data: milestoneClaimedEvents } = useMilestoneClaimedEvents()

  // COMPUTED VALUES
  const totalGrantsApproved = useMemo(() => {
    return enrichedGrantProposals.filter(proposal =>
      [ProposalState.Succeeded, ProposalState.InDevelopment, ProposalState.Completed, ProposalState.Executed].includes(
        proposal.state,
      ),
    ).length
  }, [enrichedGrantProposals])

  const totalDistributedAmount = useMemo(() => {
    return (
      milestoneClaimedEvents?.reduce((acc, event) => acc.plus(BigNumber(event.amount)), BigNumber(0)) ?? BigNumber(0)
    )
  }, [milestoneClaimedEvents])

  const showApplyForGrant = useMemo(() => {
    return account?.address && hasMetProposalCriteria
  }, [account?.address, hasMetProposalCriteria])

  const onApplyForGrant = useCallback(() => {
    router.push("/proposals/grants/new")
  }, [router])

  return (
    <>
      <VStack w="full" gap={8} pb={8}>
        <GrantsBanners />
        <HStack w="full" justifyContent="space-between">
          <HStack alignItems="center" textAlign="center" w="full" justifyContent="flex-start">
            <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Grants")}</Heading>
            {!open && (
              <Link
                display="inline-flex"
                alignItems="center"
                fontWeight={500}
                color="primary.500"
                fontSize={{ base: "xs", lg: "md" }}
                onClick={onOpen}>
                <Icon as={UilInfoCircle} boxSize={4} />
                {t("More info")}
              </Link>
            )}
          </HStack>
          {showApplyForGrant && (
            <HStack gap="4">
              <Button
                asChild
                variant="ghost"
                color="actions.tertiary.default"
                size={{ base: "sm", md: "md" }}
                rounded="full">
                <Link href="grants/manage">{t("My grants")}</Link>
              </Button>
              <Button variant="primaryAction" size={{ base: "sm", md: "md" }} onClick={onApplyForGrant}>
                <Text>{t("Apply for Grant")}</Text>
              </Button>
            </HStack>
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
              <HStack w="full" gap={4}>
                <SearchField
                  inputProps={{ minW: "200px", flex: 1 }}
                  placeholder={t("Search by grant name")}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  disabled={!enrichedGrantProposals?.length}
                />

                {isMobile ? (
                  <>
                    {/* Mobile Filter */}
                    <MobileFilterDrawer
                      options={filterOptions}
                      selectedValues={selectedFilter}
                      onApply={setSelectedFilter}
                      placeholder={t("Filter statuses")}
                    />
                  </>
                ) : (
                  <>
                    {/* Desktop Filter */}
                    <SelectField
                      w="25%"
                      placeholder={t("Status")}
                      options={filterOptions}
                      defaultValue={filterDefaultValues}
                      showReset
                      onChange={values => setSelectedFilter(values.map(item => item as ProposalFilter | StateFilter))}
                      isMultiOption
                    />
                  </>
                )}
              </HStack>

              <Grid templateColumns={{ base: "1fr" }} gap={8} w="full">
                {isLoadingEnrichedGrantProposals ? (
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <GridItem key={`grants-list-skeleton-${index + 1}`}>
                        <Skeleton loading={true} h="200px" w="full" borderRadius="md">
                          <div />
                        </Skeleton>
                      </GridItem>
                    ))}
                  </>
                ) : (
                  filteredProposals &&
                  filteredProposals?.map(proposal => (
                    <GridItem key={proposal.id}>
                      <GrantsProposalCard
                        key={proposal.id}
                        proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }}
                      />
                    </GridItem>
                  ))
                )}
              </Grid>
            </VStack>
          </GridItem>
          <GridItem colSpan={{ base: 1, md: 1 }}>
            <HowToSupportCard onOpenConvertModal={onOpenConvertModal} />
          </GridItem>
        </Grid>
      </VStack>

      {/* Convert/Swap Modal */}
      <ConvertModal isOpen={isOpenConvertModal} onClose={onCloseConvertModal} />
    </>
  )
}
