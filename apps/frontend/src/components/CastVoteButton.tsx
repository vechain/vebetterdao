import { Button, useDisclosure } from "@chakra-ui/react"
import { CastVoteModal } from "./CastVoteModal"
import { ProposalCreatedEvent, useHasVoted, useProposalState } from "@/api"

import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  proposal: ProposalCreatedEvent
}
export const CastVoteButton: React.FC<Props> = ({ proposal }) => {
  const { onOpen, isOpen, onClose } = useDisclosure()
  const { account } = useWallet()
  const { data: state } = useProposalState(proposal.proposalId)

  const { data: hasVoted } = useHasVoted(proposal.proposalId, account ?? undefined)

  const isDisabled = !account || state !== 1 || hasVoted

  return (
    <>
      <CastVoteModal isOpen={isOpen} onClose={onClose} proposal={proposal} />

      <Button onClick={onOpen} isDisabled={isDisabled}>
        {hasVoted ? "You voted" : "Cast your vote"}
      </Button>
    </>
  )
}
