"use client"

import { Grid, GridItem, HStack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { ConvertModal, SearchField } from "@/components"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useDebounce, useProposalSearch } from "@/hooks"
import { useMemo, useState } from "react"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"

import { GrantsProposalCard } from "../components/GrantsProposalCard"
import { useWallet } from "@vechain/vechain-kit"
import { EmptyState } from "@/components/ui/empty-state"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useDraftGrantProposalStore } from "@/store"
import { GrantsProposalDraftCard } from "../components/GrantsProposalDraftCard"
import Link from "next/link"
import { HowToSupportCard } from "@/app/proposals"
import { useRouter } from "next/navigation"

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

export default function GrantsNew() {
  const { account } = useWallet()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const router = useRouter()

  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] as GrantProposalEnriched[] } } =
    useProposalEnriched()
  const { draftGrantProposals } = useDraftGrantProposalStore()
  const usersGrants = useMemo(() => {
    return enrichedGrantProposals.filter(proposal => compareAddresses(proposal.proposerAddress, account?.address))
  }, [enrichedGrantProposals, account?.address])

  const proposals = [...draftGrantProposals, ...usersGrants]
  const searchedProposals = useProposalSearch(proposals, debouncedSearchTerm)

  const userHasGrantsProposal = useMemo(() => {
    return searchedProposals && searchedProposals.length > 0
  }, [searchedProposals])

  const applyForGrant = () => {
    router.push(`/grants/new`)
  }

  return (
    <>
      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <GridItem display="flex" flexDirection="column" gap="4">
          <HStack justifyContent="space-between">
            <PageBreadcrumb items={BreadcrumItems} />
            {userHasGrantsProposal && (
              <Button asChild variant="primaryAction" size="md">
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
              "id" in proposal ? (
                <GrantsProposalCard
                  key={proposal.id}
                  proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }}
                />
              ) : (
                <GrantsProposalDraftCard key={proposal.projectName} proposal={proposal} />
              ),
            )
          ) : (
            <EmptyState title={t("No grants proposal found")}>
              <Button variant="primaryAction" size="md" onClick={applyForGrant}>
                {t("Apply for grant")}
              </Button>
            </EmptyState>
          )}
        </GridItem>
        <GridItem>
          <HowToSupportCard onOpenConvertModal={() => setIsOpenConvertModal(true)} />
        </GridItem>
      </Grid>
      {/* Convert/Swap Modal */}
      <ConvertModal isOpen={isOpenConvertModal} onClose={() => setIsOpenConvertModal(false)} />
    </>
  )
}
