import { Button, ButtonProps } from "@chakra-ui/react"
import { FaFile } from "react-icons/fa6"
import { useDropzone } from "react-dropzone"

type Props = { onDrop: (acceptedFiles: File[]) => void } & Omit<ButtonProps, "onDrop">
export const UploadFileButton = ({ onDrop, ...props }: Props) => {
  const { open } = useDropzone({ onDrop: onDrop })
  return (
    <Button variant="outline" colorScheme="primary" rounded="full" onClick={open} leftIcon={<FaFile />} {...props}>
      Upload File
    </Button>
  )
}
