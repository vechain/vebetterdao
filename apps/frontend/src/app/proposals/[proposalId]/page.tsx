"use client"
import { VStack, Spinner } from "@chakra-ui/react"
import dynamic from "next/dynamic"

const ProposalPageContent = dynamic(
  () => import("./components/ProposalPageContent").then(mod => mod.ProposalPageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)
// TODO: add dynamic import if needed
export default () => {
  return <ProposalPageContent />
}
