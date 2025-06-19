import { getProposalsEvents, ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsThorClient, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { ProposalPage } from "./ProposalPage"

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

  const proposalsEvents = await getProposalsEvents(thor, params.proposalId)

  const proposal = proposalsEvents.created.find(ev => ev.proposalId === id)
  if (!proposal) throw new Error(`Proposal ${id} not found`)

  const proposalMetadata = await getIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))

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
