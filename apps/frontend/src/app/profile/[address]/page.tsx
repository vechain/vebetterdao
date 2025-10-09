"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../../components/MotionVStack"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { isValid } from "../../../utils/AddressUtils/AddressUtils"

import Custom404 from "@/app/not-found"
const ProfilePageContent = dynamic(
  () => import("../components/ProfilePageContent").then(mod => mod.ProfilePageContent),
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
export default function Profile({ params }: Readonly<Props>) {
  useEffect(() => {
    AnalyticsUtils.trackPage("Profile")
  }, [])
  if (!isValid(params.address)) {
    return <Custom404 />
  }
  return (
    <MotionVStack>
      <ProfilePageContent address={params.address} />
    </MotionVStack>
  )
}
