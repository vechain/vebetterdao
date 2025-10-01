import { ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsThorClient, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { Props } from "./page"
import { getDefaultMetadata } from "@/utils/metadata"
import { APPLICATION_NAME, IMAGE_DIMENSION, pagesMetadata } from "@/metadata/pages"
import { decodeEventLog } from "@/api/contracts/governance/getEvents"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const id = params.grantId

    if (!id) {
      return getDefaultMetadata()
    }

    const thor = await getNodeJsThorClient()
    const contract = thor.contracts.load(address, abi)

    const eventTopics = contract.getEventAbi("ProposalCreated")?.encodeFilterTopicsNoNull({ proposalId: id })

    const [rawProposalEvent] = await thor.logs.filterRawEventLogs({
      options: { limit: 1 },
      criteriaSet: [
        {
          address,
          topic0: eventTopics?.[0],
          topic1: eventTopics?.[1],
        },
      ],
    })

    const proposal = decodeEventLog(rawProposalEvent!, abi)
    if (proposal.decodedData?.eventName !== "ProposalCreated") {
      return getDefaultMetadata()
    }
    const proposalData = proposal.decodedData?.args

    const proposalDesc = proposalData?.description
    let proposalMetadata: ProposalMetadata | null = null
    if (proposalDesc) {
      proposalMetadata = await getIpfsMetadata<ProposalMetadata>(toIPFSURL(proposalDesc))
    }

    const metadataTitle = proposalMetadata?.title
      ? `${proposalMetadata.title} | ${APPLICATION_NAME}`
      : `Grant | ${APPLICATION_NAME}`

    const metadataDesc = proposalMetadata?.shortDescription
      ? proposalMetadata.shortDescription
      : pagesMetadata.proposals.description

    const config = getConfig()
    const pageUrl = `${config.basePath}/grants/${id}`

    const defaultProposalImage = {
      url: `${config.basePath}${pagesMetadata.grants.image}`,
      alt: `${metadataTitle} | ${APPLICATION_NAME}`,
      width: IMAGE_DIMENSION.width,
      height: IMAGE_DIMENSION.height,
    }

    return {
      title: metadataTitle,
      description: metadataDesc,
      openGraph: {
        title: metadataTitle,
        description: metadataDesc,
        type: "website",
        url: pageUrl,
        siteName: APPLICATION_NAME,
        images: [defaultProposalImage],
      },
      twitter: {
        title: metadataTitle,
        description: metadataDesc,
        card: "summary_large_image",
        site: config.basePath,
        images: [defaultProposalImage],
      },
    }
  } catch (error) {
    console.error("Error generating metadata for grant:", params.grantId, error)
    return getDefaultMetadata()
  }
}

export default function GrantsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
