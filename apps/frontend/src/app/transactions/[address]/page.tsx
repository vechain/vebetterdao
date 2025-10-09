"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
const TransactionsContent = dynamic(
  () => import("../components/TransactionsContent").then(mod => mod.TransactionsContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
type Props = {
  params: {
    address: string
  }
}
export default function Home({ params }: Props) {
  useEffect(() => {
    AnalyticsUtils.trackPage("Transactions")
  }, [])
  return (
    <MotionVStack>
      <TransactionsContent address={params.address} />
    </MotionVStack>
  )
}
