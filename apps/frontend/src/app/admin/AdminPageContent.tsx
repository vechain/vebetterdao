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
import { ContractsDetails } from "./components/ContractsDetails"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { isAdminOfX2EarnApps, isAdminOfVot3, isAdminOfB3tr, isAdminOfGalaxyMember, isAdminOfB3TRGovernor } =
    useAccountPermissions(account ?? "")

  const canSeePauseTab = isAdminOfB3tr || isAdminOfGalaxyMember || isAdminOfVot3 || isAdminOfB3TRGovernor

  return (
    <Stack spacing={12} w={"full"} data-testid="admin-page">
      <Tabs>
        <TabList
          overflowY="hidden"
          sx={{
            scrollbarWidth: "none",
            "::-webkit-scrollbar": {
              display: "none",
            },
          }}>
          <Tab>{"Emissions"}</Tab>
          {isAdminOfX2EarnApps && <Tab>{"X2Earn Apps"}</Tab>}
          <Tab>{"Utils"}</Tab>
          <Tab>{"Contracts"}</Tab>
          {canSeePauseTab && <Tab>{"Pausing"}</Tab>}
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

          {isAdminOfX2EarnApps && (
            <TabPanel>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <UpdateReceiverAddress />
              </Grid>
            </TabPanel>
          )}

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <B3trAllowance />
            </Grid>
          </TabPanel>

          <TabPanel>
            <ContractsDetails />
          </TabPanel>

          {canSeePauseTab && (
            <TabPanel>
              <Pause />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
