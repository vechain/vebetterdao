"use client"

import { Stack, Tabs, TabList, Tab, TabPanels, TabPanel, Grid, GridItem } from "@chakra-ui/react"
import { useEffect } from "react"
import { AnalyticsUtils } from "@/utils"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/dapp-kit-react"
import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"
import { Pause } from "./components/Pause"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"
import { StartRoundCard } from "./components/StartRoundCard/StartRoundCard"
import { ContractsBalances } from "./components/Contracts/ContractsBalances"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { isAdminOfXAllocationVoting, isAdmin } = useAccountPermissions(account ?? "")

  return (
    <Stack spacing={12} w={"full"} data-testid="admin-page">
      <Tabs>
        <TabList>
          <Tab>Emissions</Tab>
          <Tab>X2Earn Apps</Tab>
          <Tab>Utils</Tab>
          <Tab>Contracts</Tab>
          <Tab>Pausing</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <GridItem colSpan={2}>
                <StartRoundCard />
              </GridItem>
              <ClaimXAppAllocations />
              <BulkClaimXAppsAllocations />
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              {isAdminOfXAllocationVoting && <UpdateReceiverAddress />}
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <B3trAllowance />
            </Grid>
          </TabPanel>

          <TabPanel>
            <ContractsBalances />
          </TabPanel>

          <TabPanel>
            <Pause />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
