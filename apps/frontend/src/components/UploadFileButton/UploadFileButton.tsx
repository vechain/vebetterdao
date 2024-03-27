import { Button, ButtonProps } from "@chakra-ui/react"
import { FaFile } from "react-icons/fa6"

type Props = ButtonProps
export const UploadFileButton = ({ ...props }: Props) => {
  return (
    <Button variant="outline" colorScheme="primary" rounded="full" {...props} leftIcon={<FaFile />}>
      Upload File
    </Button>
  )
}
