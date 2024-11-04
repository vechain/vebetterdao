"use client"

import { useCurrentAllocationsRoundId } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { AnalyticsUtils } from "@/utils"
import { Grid, GridItem, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useEffect } from "react"
import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { XAppCheckEndorsement } from "./components/XAppCheckEndorsement"
import { ContractsDetails } from "./components/ContractsDetails"
import { Pause } from "./components/Pause"
import { StartRoundCard } from "./components/StartRoundCard/StartRoundCard"
import { UpdateAppsEligibility } from "./components/UpdateAppsEligibility"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"
import { UpdateRoleCard } from "./components/UpdateRoleCard"
import { VeBetterPassport } from "./components/VeBetterPassport/VeBetterPassport"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"

const isLocalhost = process.env.NODE_ENV === "development"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account ?? "")

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const canSeePauseTab =
    permissions?.isAdminOfB3tr ||
    permissions?.isAdminOfGalaxyMember ||
    permissions?.isAdminOfVot3 ||
    permissions?.isAdminOfB3TRGovernor

  const canSeeVeBetterPassportTab =
    permissions?.isAdminOfVeBetterPassport ||
    permissions?.isPassportSettingsManager ||
    permissions?.isPassportBotSignaler ||
    permissions?.isPassportActionRegistrar ||
    permissions?.isPassportScoreManager ||
    permissions?.isPassportWhitelister

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
          {permissions?.isAdminOfX2EarnApps && <Tab>{"X2Earn Apps"}</Tab>}
          <Tab>{"Utils"}</Tab>
          <Tab>{"Contracts"}</Tab>
          {canSeePauseTab && <Tab>{"Pausing"}</Tab>}
          {canSeeVeBetterPassportTab && <Tab>{"VeBetter Passport"}</Tab>}
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
          {permissions?.isAdminOfX2EarnApps && (
            <TabPanel>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <UpdateReceiverAddress />
                <UpdateAppsEligibility />
                {isLocalhost ? <XAppCheckEndorsement /> : null}
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

          {canSeeVeBetterPassportTab && (
            <TabPanel>
              <VeBetterPassport />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
