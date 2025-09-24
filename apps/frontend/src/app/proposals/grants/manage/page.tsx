"use client"

import { Grid, GridItem, HStack, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { HowToSupportCard } from "../../components"
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

const BreadcrumItems = [
  {
    label: "Grants",
    href: "/proposals/grants",
  },
  {
    label: "My grants",
    href: "/proposals/grants/manage",
  },
]

export default function GrantsNew() {
  const { account } = useWallet()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: { enrichedGrantProposals } = { enrichedGrantProposals: [] as GrantProposalEnriched[] } } =
    useProposalEnriched()
  const searchedProposals = useProposalSearch(enrichedGrantProposals, debouncedSearchTerm)

  const usersGrants = useMemo(() => {
    return searchedProposals.filter(proposal => compareAddresses(proposal.proposerAddress, account?.address))
  }, [searchedProposals, account?.address])

  const anyGrantExists = useMemo(() => {
    return usersGrants && usersGrants.length > 0
  }, [usersGrants])

  return (
    <>
      <Grid alignItems="flex-start" w={"full"} gap={4} templateColumns={{ base: "1fr", md: "2fr 1fr" }}>
        <GridItem display="flex" flexDirection="column" gap="4">
          <HStack justifyContent="space-between">
            <PageBreadcrumb items={BreadcrumItems} />
            {anyGrantExists && (
              <Button variant="primaryAction" size="md">
                {t("Apply for grant")}
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
          {anyGrantExists ? (
            usersGrants?.map(proposal => (
              <GrantsProposalCard
                key={proposal.id}
                variant="card"
                mode="edit"
                proposal={proposal as GrantProposalEnriched & { isDepositReached: boolean }}
              />
            ))
          ) : (
            <EmptyState title={t("No grants proposal found")}>
              <Button variant="primaryAction" size="md">
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
