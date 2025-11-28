"use client"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

import { MotionVStack } from "../../components/MotionVStack"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"
const ProfilePageContent = dynamic(
  () => import("./components/ProfilePageContent").then(mod => mod.ProfilePageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
export default function Profile() {
  useEffect(() => {
    AnalyticsUtils.trackPage("Profile")
  }, [])

  return (
    <MotionVStack>
      <ProfilePageContent />
    </MotionVStack>
  )
}
