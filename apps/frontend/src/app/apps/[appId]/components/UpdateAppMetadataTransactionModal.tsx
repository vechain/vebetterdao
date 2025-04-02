import { useDisclosure } from "@chakra-ui/react"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"

type Props = {
  transactionModal: ReturnType<typeof useDisclosure>
  handleClose: () => void
  uploadMetadataMutation: ReturnType<typeof useUploadAppMetadata>
  updateAppDetailsMutation: ReturnType<typeof useUpdateAppDetails>
  onTryAgain: () => void
}
// TODO: Implement this modal to be a centralized modal for all metadata transactions
export const UpdateAppMetadataTransactionModal = ({}: Props) => {
  return <></>
}
