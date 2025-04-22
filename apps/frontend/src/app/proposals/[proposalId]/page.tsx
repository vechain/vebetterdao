import { getProposalsEvents, ProposalMetadata } from "@/api/contracts/governance/getProposalsEvents"
import { getIpfsMetadata } from "@/api/ipfs"
import { getNodeJsConnex, toIPFSURL } from "@/utils"
import { ResolvingMetadata, Metadata } from "next"
import { getConfig } from "@repo/config"
import { ProposalPage } from "./ProposalPage"

type Props = {
  params: Promise<{
    proposalId: string
  }>
}

export async function generateMetadata(props: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params
  // read route params
  const id = params.proposalId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  const connex = await getNodeJsConnex()

  const proposalsEvents = await getProposalsEvents(connex.thor, params.proposalId)

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

export default async function Proposal(props: Readonly<Props>) {
  const params = await props.params
  return <ProposalPage params={params} />
}
