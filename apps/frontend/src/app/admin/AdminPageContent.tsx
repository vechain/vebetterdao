"use client"
import { Box, Grid, GridItem, NativeSelect, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useEffect, useState } from "react"

import { useAccountPermissions } from "../../api/contracts/account/hooks/useAccountPermissions"
import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"

import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"
import { ContractsDetails } from "./components/ContractsDetails"
import { GMSetMaxLevel } from "./components/GMSetMaxLevel"
import { ManageCreatorsNFT } from "./components/ManageCreatorsNFT"
import { Pause } from "./components/Pause"
import { StartRoundCard } from "./components/StartRoundCard/StartRoundCard"
import { UpdateAppsEligibility } from "./components/UpdateAppsEligibility"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"
import { UpdateRoleCard } from "./components/UpdateRoleCard"
import { VeBetterPassport } from "./components/VeBetterPassport/VeBetterPassport"
import { XAppAssignAppCategory } from "./components/XAppAssignAppCategory"
import { XAppCheckEndorsement } from "./components/XAppCheckEndorsement"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const [tab, setTab] = useState("emissions")
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
  const hasAllocationRewards = Number(currentRoundId) > 0

  return (
    <Tabs.Root
      variant="subtle"
      colorPalette="actions.primary"
      w="full"
      data-testid="admin-page"
      lazyMount
      value={tab}
      onValueChange={d => setTab(d.value)}>
      <Box hideFrom="lg" w="full" pb={3} borderBottomWidth="1px" borderBottomStyle="solid" borderColor="border.primary">
        <NativeSelect.Root size="sm" w="full">
          <NativeSelect.Field value={tab} onChange={e => setTab(e.target.value)}>
            <option value="emissions">{"Emissions"}</option>
            {hasAllocationRewards && <option value="allocation-rewards">{"Allocation Rewards"}</option>}
            <option value="x2earn-apps">{"X2Earn Apps"}</option>
            <option value="utils">{"Utils"}</option>
            <option value="contracts">{"Contracts"}</option>
            {canSeePauseTab && <option value="pausing">{"Pausing"}</option>}
            {canSeeVeBetterPassportTab && <option value="vebetter-passport">{"VeBetter Passport"}</option>}
            {canSeeGalaxyMemberTab && <option value="galaxy-member">{"Galaxy Member"}</option>}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>

      <Tabs.Indicator rounded="full" />
      <Tabs.List
        hideBelow="lg"
        w="full"
        sm={{ gapX: "1" }}
        overflowY="hidden"
        scrollbar="hidden"
        justifyContent="space-evenly"
        pb={3}
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderColor="border.primary">
        <Tabs.Trigger value="emissions">{"Emissions"}</Tabs.Trigger>
        {hasAllocationRewards && <Tabs.Trigger value="allocation-rewards">{"Allocation Rewards"}</Tabs.Trigger>}
        <Tabs.Trigger value="x2earn-apps">{"X2Earn Apps"}</Tabs.Trigger>
        <Tabs.Trigger value="utils">{"Utils"}</Tabs.Trigger>
        <Tabs.Trigger value="contracts">{"Contracts"}</Tabs.Trigger>
        {canSeePauseTab && <Tabs.Trigger value="pausing">{"Pausing"}</Tabs.Trigger>}
        {canSeeVeBetterPassportTab && <Tabs.Trigger value="vebetter-passport">{"VeBetter Passport"}</Tabs.Trigger>}
        {canSeeGalaxyMemberTab && <Tabs.Trigger value="galaxy-member">{"Galaxy Member"}</Tabs.Trigger>}
      </Tabs.List>

      <Tabs.Content value="emissions">
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
          <StartRoundCard />
          <GridItem />
        </Grid>
      </Tabs.Content>

      {hasAllocationRewards && (
        <Tabs.Content value="allocation-rewards">
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
            <ClaimXAppAllocations />
            <BulkClaimXAppsAllocations />
          </Grid>
        </Tabs.Content>
      )}

      <Tabs.Content value="x2earn-apps">
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
          <XAppCheckEndorsement />
          {permissions?.isAdminOfX2EarnApps && (
            <>
              <UpdateReceiverAddress />
              <UpdateAppsEligibility />
              <XAppAssignAppCategory />
            </>
          )}
        </Grid>
      </Tabs.Content>

      <Tabs.Content value="utils">
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
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
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} gap="6" w="full">
            <GMSetMaxLevel />
          </Grid>
        </Tabs.Content>
      )}
    </Tabs.Root>
  )
}
