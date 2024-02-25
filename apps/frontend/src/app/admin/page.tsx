"use client"

import dynamic from "next/dynamic"
import { Spinner, Card, CardBody, CardHeader, Heading, Stack, VStack, HStack, Text } from "@chakra-ui/react"
import { Suspense, useEffect } from "react"
import { AnalyticsUtils } from "@/utils"

const StartEmissions = dynamic(() => import("./components/StartEmissions").then(mod => mod.StartEmissions), {
  ssr: false,
})

const StartRound = dynamic(() => import("./components/StartRound").then(mod => mod.StartRound), { ssr: false })

const AdminPermissions = dynamic(() => import("./components/AdminPermissions").then(mod => mod.AdminPermissions), {
  ssr: false,
})

const UpdateReceiverAddress = dynamic(
  () => import("./components/UpdateReceiverAddress").then(mod => mod.UpdateReceiverAddress),
  { ssr: false },
)

const ClaimXAppAllocations = dynamic(
  () => import("./components/ClaimXAppAllocations").then(mod => mod.ClaimXAppAllocations),
  { ssr: false },
)

const BulkClaimXAppsAllocations = dynamic(
  () => import("./components/BulkClaimXAppsAllocations").then(mod => mod.BulkClaimXAppsAllocations),
  { ssr: false },
)

const Pause = dynamic(() => import("./components/Pause").then(mod => mod.Pause), { ssr: false })

const B3trAllowance = dynamic(() => import("./components/B3trAllowance").then(mod => mod.B3trAllowance), { ssr: false })

export default function AdminPage() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Admin")
  }, [])

  return (
    <Suspense fallback={<Spinner alignSelf={"center"} />}>
      <Stack spacing={12} w={"full"}>
        <AdminPermissions />

        <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
          <Card w={"full"}>
            <CardHeader>
              <Heading size="lg">Emissions and Rounds</Heading>
            </CardHeader>
            <CardBody>
              <VStack w={"full"} spacing={4} alignItems={"start"}>
                <StartEmissions />
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
              <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
                <UpdateReceiverAddress />
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        <Card w={"full"}>
          <CardHeader>
            <Heading size="lg">Pausing</Heading>
          </CardHeader>
          <CardBody>
            <Pause />
          </CardBody>
        </Card>
      </Stack>
    </Suspense>
  )
}
