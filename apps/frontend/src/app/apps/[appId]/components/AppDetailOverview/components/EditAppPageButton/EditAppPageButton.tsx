import { IconButton, useDisclosure } from "@chakra-ui/react"
import { UilPen } from "@iconscout/react-unicons"
import { EditAppPageModal } from "./components/EditAppPageModal"

export const EditAppPageButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <EditAppPageModal isOpen={isOpen} onClose={onClose} />
      <IconButton variant="primaryIconButton" aria-label="Edit App Page" onClick={onOpen}>
        <UilPen size="20px" />
      </IconButton>
    </>
  )
}
