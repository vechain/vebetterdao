import { Button, useDisclosure } from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa"
import { CreateProposalModal } from "./CreateProposalModal"

export const CreateProposalButton = () => {
  const { onOpen, isOpen, onClose } = useDisclosure()

  return (
    <>
      <CreateProposalModal isOpen={isOpen} onClose={onClose} onOpen={onOpen} />
      <Button onClick={onOpen} leftIcon={<FaPlus />}>
        Create Proposal
      </Button>
    </>
  )
}
