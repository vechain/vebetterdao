import { Button, ButtonProps } from "@chakra-ui/react"
import { FaFile } from "react-icons/fa6"
import { useDropzone } from "react-dropzone"
import { useTranslation } from "react-i18next"

type Props = { onDrop: (acceptedFiles: File[]) => void } & Omit<ButtonProps, "onDrop">
export const UploadFileButton = ({ onDrop, ...props }: Props) => {
  const { open } = useDropzone({ onDrop: onDrop })
  const { t } = useTranslation()
  return (
    <Button variant="outline" colorScheme="primary" rounded="full" onClick={open} leftIcon={<FaFile />} {...props}>
      {t("Upload File")}
    </Button>
  )
}
