"use client"
import { Grid, GridItem, HStack, Button } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/ui/empty-state"

import { SearchField } from "../../../components/SearchField/SearchField"
import { useProposalSearch } from "../../../hooks/proposals/common/useProposalSearch"
import { useDebounce } from "../../../hooks/useDebounce"
import { useDraftGrantProposalStore } from "../../../store/useGrantProposalFormStore"
import { PageBreadcrumb } from "../../components/PageBreadcrumb/PageBreadcrumb"
import { GrantsProposalCard } from "../components/GrantsProposalCard"
import { GrantsProposalDraftCard } from "../components/GrantsProposalDraftCard"
import { GrantDetail } from "../types"

const BreadcrumItems = [
  {
    label: "Grants",
    href: "/grants",
  },
  {
    label: "My grants",
    href: "/grants/manage",
  },
]

export function GrantsManagePageContent({ grants }: { grants: GrantDetail[] }) {
  const { account } = useWallet()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { draftGrantProposals } = useDraftGrantProposalStore()
  const usersGrants = useMemo(() => {
    return grants.filter(proposal => compareAddresses(proposal.proposer, account?.address))
  }, [grants, account?.address])
  const proposals = [...draftGrantProposals, ...usersGrants]
  const searchedProposals = useProposalSearch(proposals, debouncedSearchTerm)

  const userHasGrantsProposal = useMemo(() => {
    return searchedProposals && searchedProposals.length > 0
  }, [searchedProposals])

  return (
    <>
      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <GridItem display="flex" flexDirection="column" gap="4">
          <HStack justifyContent="space-between">
            <PageBreadcrumb items={BreadcrumItems} />
            {userHasGrantsProposal && (
              <Button asChild variant="primary" size="md">
                <Link href="/grants/new">{t("Apply for grant")}</Link>
              </Button>
            )}
          </HStack>

          <SearchField
            inputProps={{ minW: "200px", flex: 1 }}
            placeholder={t("Search by grant name")}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </GridItem>
        <GridItem />

        <GridItem display="flex" flexDirection="column" gap="6">
          {userHasGrantsProposal ? (
            searchedProposals?.map(proposal =>
              "projectName" in proposal ? (
                <GrantsProposalDraftCard key={proposal.projectName} proposal={proposal} />
              ) : (
                <GrantsProposalCard
                  key={proposal.proposalId.toString()}
                  proposal={proposal as GrantDetail & { isDepositReached: boolean }}
                />
              ),
            )
          ) : (
            <EmptyState title={t("No grants proposal found")}>
              <Button asChild variant="primary" size="md">
                <Link href="/grants/new">{t("Apply for grant")}</Link>
              </Button>
            </EmptyState>
          )}
        </GridItem>
      </Grid>
    </>
  )
}
