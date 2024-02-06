import { Button, useDisclosure } from "@chakra-ui/react"
import { CastVoteModal } from "./CastVoteModal"

type Props = {
  proposalId: string
}
export const CastVoteButton: React.FC<Props> = ({ proposalId }) => {
  const { onOpen, isOpen, onClose } = useDisclosure()

  return (
    <>
      <CastVoteModal isOpen={isOpen} onClose={onClose} proposalId={proposalId} />
      <Button onClick={onOpen}>Cast your vote</Button>
    </>
  )
}
