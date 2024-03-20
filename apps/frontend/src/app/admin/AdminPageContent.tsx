"use client"

import { Card, CardBody, CardHeader, Heading, Stack, VStack, HStack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { AnalyticsUtils } from "@/utils"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/dapp-kit-react"
import { AdminPermissions } from "./components/AdminPermissions"
import { B3trAllowance } from "./components/B3trAllowance"
import { BulkClaimXAppsAllocations } from "./components/BulkClaimXAppsAllocations"
import { ClaimXAppAllocations } from "./components/ClaimXAppAllocations"
import { Pause } from "./components/Pause"
import { StartEmissions } from "./components/StartEmissions"
import { StartRound } from "./components/StartRound"
import { UpdateReceiverAddress } from "./components/UpdateReceiverAddress"

export const AdminPageContent = () => {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  const { account } = useWallet()
  const { isAdminOfB3tr, isAdminOfEmissions, isAdminOfXAllocationVoting, isAdminOfVot3, isAdminOfB3trBadge, isAdmin } =
    useAccountPermissions(account ?? "")

  return (
    <Stack spacing={12} w={"full"} data-testid="admin-page">
      {isAdmin && <AdminPermissions />}

      <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
        <Card w={"full"}>
          <CardHeader>
            <Heading size="lg">Emissions and Rounds</Heading>
          </CardHeader>
          <CardBody>
            <VStack w={"full"} spacing={4} alignItems={"start"}>
              {isAdminOfEmissions && <StartEmissions />}
              <StartRound />
            </VStack>
          </CardBody>
        </Card>
        <Card w={"full"}>
          <CardHeader>
            <Heading size="lg">B3TR Token Allowance</Heading>
            <Text fontSize="sm">Allow an external address to spend your B3TR tokens.</Text>
          </CardHeader>
          <CardBody>
            <B3trAllowance />
          </CardBody>
        </Card>
      </HStack>

      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">X-2-Earn Apps</Heading>
        </CardHeader>
        <CardBody>
          <VStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
            <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
              <ClaimXAppAllocations />
              <BulkClaimXAppsAllocations />
            </HStack>
            {isAdminOfXAllocationVoting && (
              <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
                <UpdateReceiverAddress />
              </HStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {(isAdminOfB3trBadge || isAdminOfB3tr || isAdminOfVot3) && (
        <Card w={"full"}>
          <CardHeader>
            <Heading size="lg">Pausing</Heading>
          </CardHeader>
          <CardBody>
            <Pause />
          </CardBody>
        </Card>
      )}
    </Stack>
  )
}
