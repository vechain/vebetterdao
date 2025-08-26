"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils, AddressUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import Custom404 from "@/app/not-found"
import { useEffect } from "react"

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
  if (!AddressUtils.isValid(params.address)) {
    return <Custom404 />
  }
  return (
    <MotionVStack>
      <ProfilePageContent address={params.address} />
    </MotionVStack>
  )
}
