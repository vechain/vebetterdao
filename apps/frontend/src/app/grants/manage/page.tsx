import { Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { getProposalsAndGrants } from "@/app/proposals/page"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

const GrantsManagePageContent = dynamic(
  () => import("../components/GrantsManagePageContent").then(mod => mod.GrantsManagePageContent),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default async function Grants() {
  const thor = await getNodeJsThorClient()
  const { grants } = await getProposalsAndGrants(thor)
  return <GrantsManagePageContent grants={grants} />
}
