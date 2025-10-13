import {
  Button,
  ButtonGroup,
  createListCollection,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Link,
  Pagination,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import BigNumber from "bignumber.js"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronLeft, LuChevronRight, LuFileText } from "react-icons/lu"

import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store/useProposalFilters"

import { useMetProposalCriteria } from "../../../api/contracts/governance/hooks/useMetProposalCriteria"
import { ConvertModal } from "../../../components/Convert/components/Modal/ConvertModal"
import { EmptyStateCard } from "../../../components/EmptyStateCard"
import { MobileFilterDrawer } from "../../../components/MobileFilterDrawer/MobileFilterDrawer"
import { SearchField } from "../../../components/SearchField/SearchField"
import { SelectField } from "../../../components/SelectField/SelectField"
import { useProposalEnriched } from "../../../hooks/proposals/common/useProposalEnriched"
import { useProposalSearch } from "../../../hooks/proposals/common/useProposalSearch"
import { GrantProposalEnriched, ProposalState } from "../../../hooks/proposals/grants/types"
import { useMilestoneClaimedEvents } from "../../../hooks/proposals/grants/useMilestoneClaimedEvents"
import { useBreakpoints } from "../../../hooks/useBreakpoints"
import { useDebounce } from "../../../hooks/useDebounce"
import { ProposalType } from "../../../types/proposals"
import { HowToSupportCard } from "../../proposals/components/components/HowToSupportCard"

import { GrantsBanners } from "./Banner/GrantsBanners"
import { GrantsProposalCard } from "./GrantsProposalCard"
import { GrantsStatsCards } from "./GrantsStatsCards"
import { GrantsStepsCard } from "./GrantsStepCard"

const pageSize = 10

enum GrantsStep {
  SUBMIT_APPLICATION = "SUBMIT_APPLICATION",
  GET_SUPPORT = "GET_SUPPORT",
  COMMUNITY_VOTE = "COMMUNITY_VOTE",
  RECEIVE_FUNDS = "RECEIVE_FUNDS",
}
//All filters except Canceled
const DEFAULT_FILTERS = [
  ProposalFilter.ApprovalPhase,
  ProposalFilter.SupportPhase,
  StateFilter.InDevelopment,
  StateFilter.Completed,
]

export const GrantsPageContent = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()

  //CONSTANTS

  const filterOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: t("Approval phase"), value: ProposalFilter.ApprovalPhase },
        { label: t("Support phase"), value: ProposalFilter.SupportPhase },
        { label: t("In development"), value: StateFilter.InDevelopment },
        { label: t("Completed"), value: StateFilter.Completed },
        { label: t("Cancelled"), value: ProposalFilter.FailedStates },
      ],
    })
  }, [t])
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
  const [page, setPage] = useState(1)

  const startRange = (page - 1) * pageSize
  const endRange = startRange + pageSize

  // LOGIC HOOKS
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { hasMetProposalCriteria } = useMetProposalCriteria(ProposalType.GRANT)

  const { selectedFilter, setSelectedFilter } = useProposalFilters()
  const {
    data: { enrichedGrantProposals } = { enrichedGrantProposals: [] },
    isLoading: isLoadingEnrichedGrantProposals,
  } = useProposalEnriched()
  const searchedProposals = useProposalSearch(enrichedGrantProposals, debouncedSearchTerm)
  const { filteredProposals } = useFilteredProposals(
    selectedFilter,
    searchedProposals as GrantProposalEnriched[],
    DEFAULT_FILTERS,
  )
  const { data: milestoneClaimedEvents } = useMilestoneClaimedEvents()

  const visibleProposal = filteredProposals?.slice(startRange, endRange)

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
    router.push("/grants/new")
  }, [router])

  // Render helpers
  const renderSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <GridItem key={`grants-list-skeleton-${index + 1}`}>
          <Skeleton loading={true} h="200px" w="full" borderRadius="md">
            <div />
          </Skeleton>
        </GridItem>
      ))}
    </>
  )

  const renderProposals = () =>
    visibleProposal?.map(proposal => (
      <GridItem key={proposal.id}>
        <GrantsProposalCard proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }} />
      </GridItem>
    ))

  const renderEmptyState = () => {
    const hasFiltersOrSearch = searchTerm || selectedFilter.length > 0
    const title = t("No grants found")
    const description = hasFiltersOrSearch
      ? t("Try adjusting your search or filters")
      : t("Be the first to submit a grant proposal")

    const action =
      !hasFiltersOrSearch && showApplyForGrant
        ? {
            label: t("Apply for Grant"),
            onClick: onApplyForGrant,
            variant: "outline" as const,
            size: "sm" as const,
          }
        : undefined

    return (
      <GridItem>
        <EmptyStateCard icon={<LuFileText />} title={title} description={description} action={action} />
      </GridItem>
    )
  }

  return (
    <>
      <VStack w="full" gap={8} pb={8}>
        <GrantsBanners />
        <Stack direction={{ base: "column", md: "row" }} w="full" justifyContent="space-between">
          <HStack alignItems="center" textAlign="center" w="full" justifyContent="flex-start">
            <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Grants")}</Heading>
            {!open && (
              <Link
                display="inline-flex"
                alignItems="center"
                fontWeight={500}
                color="primary.500"
                px={0}
                textStyle={{ base: "xs", lg: "md" }}
                onClick={onOpen}>
                <Icon as={UilInfoCircle} boxSize={4} />
                {!isMobile && t("More info")}
              </Link>
            )}
          </HStack>
          {showApplyForGrant && (
            <HStack w="full" justifyContent={{ base: "space-between", md: "flex-end" }}>
              <Button
                asChild
                variant={isMobile ? "secondary" : "ghost"}
                color={isMobile ? "actions.secondary.text" : "actions.tertiary.default"}
                focusRingColor="actions.tertiary.default"
                size="md"
                w={{ base: "48%", md: "auto" }}
                rounded="full">
                <Link href="grants/manage" textStyle={"md"}>
                  {t("My grants")}
                </Link>
              </Button>

              <Button variant="primary" size="md" onClick={onApplyForGrant} w={{ base: "48%", md: "auto" }}>
                {t("Apply for Grant")}
              </Button>
            </HStack>
          )}
        </Stack>

        <GrantsStepsCard steps={stepsArray} isOpen={open} onClose={onClose} />
        {!isMobile && (
          <GrantsStatsCards
            totalApplications={enrichedGrantProposals?.length || 0}
            totalApproved={totalGrantsApproved}
            totalFunds={totalDistributedAmount.toNumber()}
          />
        )}

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <VStack gap={5} alignItems="stretch">
              <HStack w="full" gap={4}>
                <SearchField
                  inputProps={{ minW: "200px", flex: 1 }}
                  placeholder={t("Search by grant name")}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  disabled={!enrichedGrantProposals?.length}
                />

                {isMobile ? (
                  <MobileFilterDrawer
                    options={filterOptions}
                    selectedValues={selectedFilter}
                    onApply={setSelectedFilter}
                    placeholder={t("Filter statuses")}
                  />
                ) : (
                  <SelectField
                    w="25%"
                    placeholder={t("Status")}
                    options={filterOptions}
                    defaultValue={[]}
                    showReset
                    isMultiOption
                    onChange={(value: string[]) =>
                      setSelectedFilter(value.map(item => item as ProposalFilter | StateFilter))
                    }
                  />
                )}
              </HStack>

              <Grid templateColumns={{ base: "1fr" }} gap={5} w="full">
                {isLoadingEnrichedGrantProposals && renderSkeleton()}
                {!isLoadingEnrichedGrantProposals &&
                  filteredProposals &&
                  filteredProposals.length > 0 &&
                  renderProposals()}

                {filteredProposals && filteredProposals.length > 0 && (
                  <Pagination.Root
                    mx={{ base: "auto", md: "unset" }}
                    defaultPage={1}
                    count={filteredProposals.length}
                    pageSize={pageSize}
                    page={page}
                    onPageChange={e => setPage(e.page)}
                    display="flex"
                    alignItems="center"
                    gap="4">
                    {!isMobile && (
                      <HStack gap="1">
                        <Text textStyle="sm">{t("Showing")}</Text>

                        <Pagination.PageText format="long" />
                      </HStack>
                    )}

                    <ButtonGroup variant="ghost" size="xs">
                      <Pagination.PrevTrigger asChild>
                        <IconButton>
                          <LuChevronLeft />
                        </IconButton>
                      </Pagination.PrevTrigger>

                      {isMobile ? (
                        <Pagination.PageText format="long" />
                      ) : (
                        <Pagination.Items
                          render={page => (
                            <IconButton rounded="full" variant={{ base: "ghost", _selected: "surface" }}>
                              {page.value}
                            </IconButton>
                          )}
                        />
                      )}

                      <Pagination.NextTrigger asChild>
                        <IconButton>
                          <LuChevronRight />
                        </IconButton>
                      </Pagination.NextTrigger>
                    </ButtonGroup>
                  </Pagination.Root>
                )}

                {!isLoadingEnrichedGrantProposals &&
                  (!filteredProposals || filteredProposals.length === 0) &&
                  renderEmptyState()}
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
