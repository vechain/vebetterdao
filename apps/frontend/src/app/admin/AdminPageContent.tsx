"use client"

import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { AnalyticsUtils } from "@/utils"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/dapp-kit-react"
import { AdminPermissions } from "./components/AdminPermissions"
import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"
import { Pause } from "./components/Pause"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"
import { StartRoundCard } from "./components/StartRoundCard/StartRoundCard"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { isAdminOfB3tr, isAdminOfXAllocationVoting, isAdminOfVot3, isAdminOfGalaxyMember, isAdmin } =
    useAccountPermissions(account ?? "")

  return (
    <Stack spacing={12} w={"full"} data-testid="admin-page">
      <Tabs>
        <TabList>
          <Tab>Emissions</Tab>
          <Tab>X2Earn Apps</Tab>
          <Tab>Permissions</Tab>
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
            <Stack direction={["column", "row"]} w={"full"} spacing={12} alignItems={"start"}>
              {isAdminOfXAllocationVoting && <UpdateReceiverAddress />}
            </Stack>
          </TabPanel>
          <TabPanel>
            <Stack direction={["column", "row"]} w={"full"} spacing={12} alignItems={"start"}>
              {isAdmin && <AdminPermissions />}

              <Card w={"full"}>
                <CardHeader>
                  <Heading size="lg">B3TR Token Allowance</Heading>
                  <Text fontSize="sm">Allow an external address to spend your B3TR tokens.</Text>
                </CardHeader>
                <CardBody>
                  <B3trAllowance />
                </CardBody>
              </Card>
            </Stack>
          </TabPanel>
          <TabPanel>
            {(isAdminOfGalaxyMember || isAdminOfB3tr || isAdminOfVot3) && (
              <Card w={"full"}>
                <CardHeader>
                  <Heading size="lg">Pausing</Heading>
                </CardHeader>
                <CardBody>
                  <Pause />
                </CardBody>
              </Card>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  )
}
