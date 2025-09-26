import { ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsThorClient, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { Props } from "./page"
import { getDefaultMetadata } from "@/utils/metadata"
import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const id = params.proposalId

    if (!id) {
      return getDefaultMetadata()
    }

    const thor = await getNodeJsThorClient()
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
    if (!description) return getDefaultMetadata()

    const proposalMetadata = await getIpfsMetadata<ProposalMetadata>(toIPFSURL(description))
    if (!proposalMetadata?.title || !proposalMetadata?.shortDescription) return getDefaultMetadata()

    const config = getConfig()
    const pageUrl = `${config.basePath}/proposals/${id}`
    const title = `${proposalMetadata.title} | ${APPLICATION_NAME}`
    const defaultProposalImage = {
      url: `${config.basePath}${pagesMetadata.proposals.image}`,
      alt: `${proposalMetadata.title} | ${APPLICATION_NAME}`,
      width: IMAGE_DIMENSION.width,
      height: IMAGE_DIMENSION.height,
    }

    return {
      title,
      description: proposalMetadata.shortDescription,
      openGraph: {
        title,
        description: proposalMetadata.shortDescription,
        type: "website",
        url: pageUrl,
        siteName: APPLICATION_NAME,
        images: [defaultProposalImage],
      },
      twitter: {
        title,
        description: proposalMetadata.shortDescription,
        card: "summary_large_image",
        site: config.basePath,
        images: [defaultProposalImage],
      },
    }
  } catch (error) {
    console.error("Error generating metadata for proposal:", params.proposalId, error)
    return getDefaultMetadata()
  }
}

export default function ProposalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
