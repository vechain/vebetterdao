"use client"

import { useCurrentAllocationsRoundId } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { AnalyticsUtils } from "@/utils"
import { Grid, GridItem, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useEffect } from "react"
import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"
import { ContractsDetails } from "./components/ContractsDetails"
import { Pause } from "./components/Pause"
import { StartRoundCard } from "./components/StartRoundCard/StartRoundCard"
import { UpdateAppsEligibility } from "./components/UpdateAppsEligibility"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"
import { UpdateRoleCard } from "./components/UpdateRoleCard"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { isAdminOfX2EarnApps, isAdminOfVot3, isAdminOfB3tr, isAdminOfGalaxyMember, isAdminOfB3TRGovernor } =
    useAccountPermissions(account ?? "")

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

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
          {Number(currentRoundId) > 0 && <Tab>{"Allocation Rewards"}</Tab>}
          {isAdminOfX2EarnApps && <Tab>{"X2Earn Apps"}</Tab>}
          <Tab>{"Utils"}</Tab>
          <Tab>{"Contracts"}</Tab>
          {canSeePauseTab && <Tab>{"Pausing"}</Tab>}
        </TabList>

        <TabPanels>
          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <StartRoundCard />
              <GridItem />
            </Grid>
          </TabPanel>

          {Number(currentRoundId) > 0 && (
            <TabPanel>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <ClaimXAppAllocations />
                <BulkClaimXAppsAllocations />
              </Grid>
            </TabPanel>
          )}
          {isAdminOfX2EarnApps && (
            <TabPanel>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <UpdateReceiverAddress />
                <UpdateAppsEligibility />
              </Grid>
            </TabPanel>
          )}

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <B3trAllowance />
              <UpdateRoleCard />
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
