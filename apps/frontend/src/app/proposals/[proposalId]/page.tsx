import { getProposalsEvents, ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsConnex, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { ProposalPage } from "./ProposalPage"
import { unstable_cache } from "next/cache"

type Props = {
  params: {
    proposalId: string
  }
}

// Wrap the data fetching logic in a cached function
const getCachedProposalData = unstable_cache(
  async (id: string): Promise<ProposalMetadata> => {
    console.log("Fetching proposal data")

    const connex = await getNodeJsConnex()

    const proposalsEvents = await getProposalsEvents(connex.thor, id)

    const proposal = proposalsEvents.created.find(ev => ev.proposalId === id)
    if (!proposal) throw new Error(`Proposal ${id} not found`)

    const proposalMetadata = await getIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))
    return proposalMetadata
  },
  [`proposal-data`],
  { revalidate: 3600 }, // Revalidate every hour
)

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.proposalId

  const proposalMetadata = await getCachedProposalData(id)

  if (!proposalMetadata) return {}

  return {
    title: `${proposalMetadata.title} - VeBetterDAO`,
    description: proposalMetadata.shortDescription,
    openGraph: {
      description: proposalMetadata.shortDescription,
    },
    twitter: {
      title: `${proposalMetadata.title} - VeBetterDAO`,
      description: proposalMetadata.shortDescription,
      card: "summary_large_image",
      site: getConfig().basePath,
    },
  }
}

export default function Proposal({ params }: Readonly<Props>) {
  return <ProposalPage params={params} />
}
