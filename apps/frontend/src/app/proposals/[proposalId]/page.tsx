"use client"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const ProposalPage = dynamic(() => import("./components/ProposalPage").then(mod => mod.ProposalPage), {
  ssr: false,
  loading: () => (
    <VStack w="full" spacing={12} h="80vh" justify="center">
      <Spinner size={"lg"} />
    </VStack>
  ),
})

const ProposalPageContainer = () => {
  return <ProposalPage />
}

export default ProposalPageContainer
