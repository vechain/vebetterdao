import { ProposalPage } from "./ProposalPage"

export type Props = {
  params: {
    proposalId: string
  }
}

export default function Proposal({ params }: Readonly<Props>) {
  return <ProposalPage params={params} />
}
