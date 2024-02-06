import { Button, useDisclosure } from "@chakra-ui/react"
import { CastVoteModal } from "./CastVoteModal"
import { useHasVoted, useProposalState } from "@/api"

import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  proposalId: string
}
export const CastVoteButton: React.FC<Props> = ({ proposalId }) => {
  const { onOpen, isOpen, onClose } = useDisclosure()
  const { account } = useWallet()
  const { data: state } = useProposalState(proposalId)

  const { data: hasVoted } = useHasVoted(proposalId, account ?? undefined)

  const isDisabled = !account || state !== 1 || hasVoted

  return (
    <>
      <CastVoteModal isOpen={isOpen} onClose={onClose} proposalId={proposalId} />

      <Button onClick={onOpen} isDisabled={isDisabled}>
        {hasVoted ? "You voted" : "Cast your vote"}
      </Button>
    </>
  )
}
