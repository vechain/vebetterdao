import { useProposalClaimableUserDeposits } from "@/api"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { GrantsProposalCard } from "@/app/grants/components"
import { MobileFilterDrawer, SearchField, SelectField } from "@/components"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { useBreakpoints, useDebounce } from "@/hooks"
import { useProposalEnriched, useProposalSearch } from "@/hooks/proposals/common"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"
import { AnalyticsUtils } from "@/utils"
import {
  Grid,
  Card,
  Box,
  Button,
  createListCollection,
  HStack,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useFilteredProposals } from "../hooks/useFilteredProposals"
import { ClaimDeposits, CreateProposalCard, NoProposalsCard, RequirementModal } from "./components"

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

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const searchedProposals = useProposalSearch(enrichedStandardProposals, debouncedSearchTerm)
  const { filteredProposals } = useFilteredProposals(selectedFilter, searchedProposals as ProposalEnriched[])

  const filterOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: t("Approval phase"), value: ProposalFilter.ApprovalPhase },
        { label: t("Support phase"), value: ProposalFilter.SupportPhase },
        { label: t("Completed"), value: ProposalFilter.StandardProposalCompleted },
        { label: t("Cancelled"), value: ProposalFilter.FailedStates },
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
    <>
      {totalClaimableDeposits > 0 && (
        <Box hideFrom="md">
          <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
        </Box>
      )}

      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <Card.Root unstyled>
          <Card.Header
            w="full"
            display="flex"
            py="4"
            flexDirection="row"
            alignItems="flex-start"
            justifyContent="space-between">
            <Card.Title textStyle={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              {t("Proposals")}
            </Card.Title>

            {filteredProposals.length > 0 && (
              <Button hideFrom="md" onClick={onNewClick} variant={"primary"}>
                {t("Create proposal")}
              </Button>
            )}
          </Card.Header>
          <Card.Body>
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
                    onChange={values => setSelectedFilter(values.map(item => item as ProposalFilter | StateFilter))}
                    isMultiOption
                  />
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
                    <Text textStyle="md" mt={2}>
                      {t("Have an idea for something that could improve the experience in VeBetter? ")}{" "}
                      <b style={{ color: "contrast-fg-on-muted" }}>{t("Create a proposal")}</b>{" "}
                      {t("and let the community vote to make it happen!")}
                    </Text>
                  }
                />
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        <VStack hideBelow="md" alignSelf="flex-start" gap={6} position={"sticky"} top={24}>
          {totalClaimableDeposits > 0 && (
            <ClaimDeposits totalClaimableDeposits={totalClaimableDeposits} claimableDeposits={claimableDeposits} />
          )}
          {filteredProposals.length > 0 && <CreateProposalCard />}
        </VStack>

        <VStack hideFrom="md" mt={2} w={"full"}>
          {filteredProposals.length > 0 && <CreateProposalCard />}
        </VStack>
        <RequirementModal
          isOpen={isRequirementModalOpen}
          onClose={closeRequirementModal}
          hasNft={hasMetProposalCriteria}
        />
      </Grid>
    </>
  )
}
