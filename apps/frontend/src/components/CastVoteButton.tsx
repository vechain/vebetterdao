import { Button, useDisclosure } from "@chakra-ui/react"
import { CreateProposalModal } from "./CreateProposalModal"

type Props = {
  proposalId: string
}
export const CastVoteButton: React.FC<Props> = ({ proposalId }) => {
  const { onOpen, isOpen, onClose } = useDisclosure()

  return (
    <>
      {/* <CreateProposalModal isOpen={isOpen} onClose={onClose} /> */}
      <Button onClick={onOpen}>Cast your vote</Button>
    </>
  )
}
