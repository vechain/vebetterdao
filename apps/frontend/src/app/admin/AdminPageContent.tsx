"use client"

import { useCurrentAllocationsRoundId } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { AnalyticsUtils } from "@/utils"
import { Grid, GridItem, Tabs } from "@chakra-ui/react"
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
import { XAppAssignAppCategory } from "./components/XAppAssignAppCategory"

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
    <Tabs.Root w={"full"} data-testid="admin-page" lazyMount defaultValue="emissions" fitted>
      <Tabs.Indicator rounded="full" />
      <Tabs.List
        sm={{ gapX: 1 }}
        overflowY="hidden"
        css={{
          scrollbarWidth: "none",
          "::-webkit-scrollbar": {
            display: "none",
          },
        }}>
        <Tabs.Trigger minW="fit-content" value="emissions">
          {"Emissions"}
        </Tabs.Trigger>
        {Number(currentRoundId) > 0 && (
          <Tabs.Trigger minW="fit-content" value="allocation-rewards">
            {"Allocation Rewards"}
          </Tabs.Trigger>
        )}
        {permissions?.isAdminOfX2EarnApps && (
          <Tabs.Trigger minW="fit-content" value="x2earn-apps">
            {"X2Earn Apps"}
          </Tabs.Trigger>
        )}
        <Tabs.Trigger minW="fit-content" value="utils">
          {"Utils"}
        </Tabs.Trigger>
        <Tabs.Trigger minW="fit-content" value="contracts">
          {"Contracts"}
        </Tabs.Trigger>
        {canSeePauseTab && (
          <Tabs.Trigger minW="fit-content" value="pausing">
            {"Pausing"}
          </Tabs.Trigger>
        )}
        {canSeeVeBetterPassportTab && (
          <Tabs.Trigger minW="fit-content" value="vebetter-passport">
            {"VeBetter Passport"}
          </Tabs.Trigger>
        )}
        {canSeeGalaxyMemberTab && (
          <Tabs.Trigger minW="fit-content" value="galaxy-member">
            {"Galaxy Member"}
          </Tabs.Trigger>
        )}
      </Tabs.List>

      <Tabs.Content value="emissions">
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <StartRoundCard />
          <GridItem />
        </Grid>
      </Tabs.Content>

      {Number(currentRoundId) > 0 && (
        <Tabs.Content value="allocation-rewards">
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
            <ClaimXAppAllocations />
            <BulkClaimXAppsAllocations />
          </Grid>
        </Tabs.Content>
      )}
      {permissions?.isAdminOfX2EarnApps && (
        <Tabs.Content value="x2earn-apps">
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
            <UpdateReceiverAddress />
            <UpdateAppsEligibility />
            <XAppCheckEndorsement />
            <XAppAssignAppCategory />
          </Grid>
        </Tabs.Content>
      )}

      <Tabs.Content value="utils">
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <B3trAllowance />
          <UpdateRoleCard />
          {canSeeX2EarnCreatorUtils ? <ManageCreatorsNFT /> : undefined}
        </Grid>
      </Tabs.Content>

      <Tabs.Content value="contracts">
        <ContractsDetails />
      </Tabs.Content>

      {canSeePauseTab && (
        <Tabs.Content value="pausing">
          <Pause />
        </Tabs.Content>
      )}

      {canSeeVeBetterPassportTab && (
        <Tabs.Content value="vebetter-passport">
          <VeBetterPassport />
        </Tabs.Content>
      )}
      {canSeeGalaxyMemberTab && (
        <Tabs.Content value="galaxy-member">
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
            <GMSetMaxLevel />
          </Grid>
        </Tabs.Content>
      )}
    </Tabs.Root>
  )
}
