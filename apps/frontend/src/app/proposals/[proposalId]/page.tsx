import { ProposalPage } from "./ProposalPage"

export type Props = {
  params: { proposalId: string }
}
export default async function Proposal({ params }: Readonly<Props>) {
  const { proposalId } = params
  return <ProposalPage proposalId={proposalId} />
}
