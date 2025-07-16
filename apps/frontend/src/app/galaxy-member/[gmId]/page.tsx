"use client"

import { useGetUserGMs } from "@/api"
import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const GmNFTPageContent = dynamic(() => import("../components/GmNFTPageContent").then(mod => mod.GmNFTPageContent), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

export default function GMNFTPage({ params }: { params: { gmId: string } }) {
  const router = useRouter()
  const { data, isLoading } = useGetUserGMs()
  const gm = data?.find(gm => gm.tokenId === params.gmId)

  useEffect(() => {
    AnalyticsUtils.trackPage("GMNFTPage")
  }, [])

  if (isLoading) return <Spinner size={"lg"} />

  if (!gm) {
    router.push("/")
    return null
  }

  return (
    <MotionVStack>
      <GmNFTPageContent gm={gm} />
    </MotionVStack>
  )
}
