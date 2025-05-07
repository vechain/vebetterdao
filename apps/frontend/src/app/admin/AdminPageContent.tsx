"use client"

import { useCurrentAllocationsRoundId } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { AnalyticsUtils } from "@/utils"
import { Grid, GridItem, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
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
import { ManageCreatorsNFT } from "./components/ManageCreatorsNFT"
import { GMSetMaxLevel } from "./components/GMSetMaxLevel"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

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

  const canSeeX2EarnCreatorUtils =
    permissions?.isAdminOfX2EarnCreator || permissions?.isMinterOfX2EarnCreator || permissions?.isBurnerOfX2EarnCreator
  const canSeeGalaxyMemberTab = permissions?.isAdminOfGalaxyMember
  return (
    <Stack spacing={12} w={"full"} data-testid="admin-page">
      <Tabs isLazy>
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
          {canSeeGalaxyMemberTab && <Tab>{"Galaxy Member"}</Tab>}
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
                <XAppCheckEndorsement />
              </Grid>
            </TabPanel>
          )}

          <TabPanel>
            <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
              <B3trAllowance />
              <UpdateRoleCard />
              {canSeeX2EarnCreatorUtils ? <ManageCreatorsNFT /> : undefined}
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
          {canSeeGalaxyMemberTab && (
            <TabPanel>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <GMSetMaxLevel />
              </Grid>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
