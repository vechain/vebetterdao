import { VStack } from "@chakra-ui/react"

import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { getProposalsAndGrants } from "../proposals/page"

import { GrantsPageContent } from "./components/GrantsPageContent"

export default async function Grants() {
  const thor = await getNodeJsThorClient()
  const { grants } = await getProposalsAndGrants(thor)

  return (
    <VStack>
      <GrantsPageContent grants={grants} />
    </VStack>
  )
}
