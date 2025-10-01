import { useProposalClaimableUserDeposits } from "@/api"
import { JoinCommunity, MobileFilterDrawer, SearchField, SelectField } from "@/components"
import {
  VStack,
  HStack,
  Heading,
  Box,
  Button,
  Spinner,
  Text,
  useDisclosure,
  createListCollection,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { RequirementModal, ClaimDeposits, CreateProposalCard, NoProposalsCard } from "./components"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useFilteredProposals } from "../hooks/useFilteredProposals"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"
import { useProposalEnriched, useProposalSearch } from "@/hooks/proposals/common"
import { GrantsProposalCard } from "@/app/grants/components"
import { useDebounce, useBreakpoints } from "@/hooks"

export const ProposalsPageContent = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const { t } = useTranslation()
  const { open: isRequirementModalOpen, onOpen: openRequirementModal, onClose: closeRequirementModal } = useDisclosure()
  const { data: { enrichedStandardProposals } = { enrichedStandardProposals: [] }, isLoading } = useProposalEnriched()
  const { data } = useProposalClaimableUserDeposits(account?.address ?? "")
  const claimableDeposits = data?.claimableDeposits ?? []
  const totalClaimableDeposits = data?.totalClaimableDeposits ?? BigInt(0)
  const { hasMetProposalCriteria } = useMetProposalCriteria()
  const { selectedFilter, setSelectedFilter } = useProposalFilters()

  // LOGIC HOOKS
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const searchedProposals = useProposalSearch(enrichedStandardProposals, debouncedSearchTerm)
  const { filteredProposals } = useFilteredProposals(selectedFilter, searchedProposals as ProposalEnriched[])

  //CONSTANTS
  const filterOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: t("Approval phase"), value: StateFilter.Active },
        { label: t("Support phase"), value: ProposalFilter.SupportPhase },
        { label: t("Completed"), value: ProposalFilter.StandardProposalCompleted },
        { label: t("Cancelled"), value: StateFilter.Canceled },
      ],
    })
  }, [t])

  const { isMobile } = useBreakpoints()

  const onNewClick = useCallback(() => {
    if (!account?.address) {
      open()
      return
    }

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL))
    openRequirementModal()
  }, [account?.address, open, openRequirementModal])

  if (isLoading)
    return (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )

  return (
    <VStack w={"full"} gap={4}>
      <VStack w={"full"} alignContent={"flex-start"}>
        <HStack gap={4} w="full" justify={"space-between"} alignItems={"center"} mb={2}>
          <Box>
            <HStack gap={3} alignItems={"center"}>
              <Heading as="h1" size="4xl">
                {t("Proposals")}
              </Heading>
            </HStack>
          </Box>

          {filteredProposals.length > 0 && (
            <Button hideFrom="md" onClick={onNewClick} variant={"primaryAction"}>
              {t("Create proposal")}
            </Button>
          )}
        </HStack>
      </VStack>

      {totalClaimableDeposits > 0 && (
        <Box hideFrom="md" mb={2} mt={3}>
          <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
        </Box>
      )}
      <HStack w={"full"} gap={8} mt={3}>
        <VStack
          flex={{ base: undefined, md: 4.5 }}
          data-testid="proposals"
          alignSelf={"flex-start"}
          gap={4}
          w={{ base: "full", md: undefined }}>
          <HStack w="full" gap={4}>
            <SearchField
              inputProps={{ minW: "200px", flex: 1 }}
              placeholder={t("Search by proposal name")}
              value={searchTerm}
              onChange={setSearchTerm}
              disabled={!enrichedStandardProposals?.length}
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
                  defaultValue={[]}
                  showReset
                  onChange={values => setSelectedFilter(values.map(item => item as ProposalFilter | StateFilter))}
                  isMultiOption
                />
              </>
            )}
          </HStack>
          {filteredProposals.map(proposal => (
            <GrantsProposalCard
              key={proposal.id}
              variant="proposal"
              proposal={proposal as ProposalEnriched & { isDepositReached: boolean }}
            />
          ))}

          {filteredProposals.length === 0 && !isLoading && (
            <NoProposalsCard
              onClick={onNewClick}
              buttonText={t("Create proposal")}
              description={
                <Text fontSize={16} fontWeight={400} mt={2}>
                  {t("Have an idea for something that could improve the experience in VeBetter? ")}{" "}
                  <b style={{ color: "contrast-fg-on-muted" }}>{t("Create a proposal")}</b>{" "}
                  {t("and let the community vote to make it happen!")}
                </Text>
              }
            />
          )}
        </VStack>

        <VStack hideBelow="md" flex={2} alignSelf="flex-start" gap={6} position={"sticky"} top={24}>
          {totalClaimableDeposits > 0 && (
            <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
          )}
          {filteredProposals.length > 0 && <CreateProposalCard />}
          <JoinCommunity />
        </VStack>
      </HStack>
      <Box hideFrom="md" mt={2} w={"full"}>
        <JoinCommunity />
      </Box>
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={closeRequirementModal}
        hasNft={hasMetProposalCriteria}
      />
    </VStack>
  )
}
