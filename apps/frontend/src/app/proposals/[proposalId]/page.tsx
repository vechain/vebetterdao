import { ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsThorClient, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { ProposalPage } from "./ProposalPage"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/typechain-types"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

type Props = {
  params: {
    proposalId: string
  }
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.proposalId
  const thor = await getNodeJsThorClient()

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  const contract = thor.contracts.load(address, abi)

  const eventTopics = contract.getEventAbi("ProposalCreated")?.encodeFilterTopicsNoNull({ proposalId: id })

  const [proposal] = await thor.logs.filterRawEventLogs({
    options: { limit: 1 },
    criteriaSet: [
      {
        address,
        topic0: eventTopics?.[0],
        topic1: eventTopics?.[1],
      },
    ],
  })

  const description = (proposal?.decodedData?.[6] || "") as string
  if (!description) return {}

  const proposalMetadata = await getIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  if (!proposalMetadata) return {}

  return {
    title: `${proposalMetadata.title} - VeBetter`,
    description: proposalMetadata.shortDescription,
    openGraph: {
      description: proposalMetadata.shortDescription,
    },
    twitter: {
      title: `${proposalMetadata.title} - VeBetter`,
      description: proposalMetadata.shortDescription,
      card: "summary_large_image",
      site: getConfig().basePath,
    },
  }
}

export default function Proposal({ params }: Readonly<Props>) {
  return <ProposalPage params={params} />
}
