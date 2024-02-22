"use client"

import dynamic from "next/dynamic"
import { Spinner, Card, CardBody, CardHeader, Heading, Stack, VStack, HStack } from "@chakra-ui/react"
import { Suspense } from "react"

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

export default function AdminPage() {
  return (
    <Suspense fallback={<Spinner alignSelf={"center"} />}>
      <Stack spacing={12} w={"full"}>
        <Card w={"full"}>
          <CardHeader>
            <Heading size="lg">Permissions</Heading>
          </CardHeader>
          <CardBody>
            <AdminPermissions />
          </CardBody>
        </Card>

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
            <Heading size="lg">X-2-Earn Apps</Heading>
          </CardHeader>
          <CardBody>
            <HStack w={"full"} spacing={12} alignItems={"start"} height={"max-content"}>
              <UpdateReceiverAddress />
            </HStack>
          </CardBody>
        </Card>
      </Stack>
    </Suspense>
  )
}
