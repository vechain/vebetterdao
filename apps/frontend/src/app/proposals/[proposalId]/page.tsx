import { ProposalPage } from "./ProposalPage"

type Props = {
  params: Promise<{ proposalId: string }>
}
export default async function Proposal({ params }: Readonly<Props>) {
  const { proposalId } = await params
  return <ProposalPage proposalId={proposalId} />
}
