"use client"

import dynamic from "next/dynamic"
import { StartRound } from "./components/StartRound"
import { StartEmissions } from "./components/StartEmissions"
import { Card, CardBody, CardHeader, HStack, Heading, VStack } from "@chakra-ui/react"

const AdminContent = dynamic(() => import("./components/AdminContent").then(mod => mod.AdminContent), { ssr: false })
export default function AdminPage() {
  return (
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
  )
}
