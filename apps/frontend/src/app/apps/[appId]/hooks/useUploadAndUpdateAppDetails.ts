import { getXAppMetadataQueryKey } from "@/api"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { useCurrentAppInfo } from "./useCurrentAppInfo"

type Props = {
  onSuccess: () => void
}

/**
 * Custom hook to upload and update app details.
 * @returns An object containing the updateAppDetailsMutation and uploadMetadataMutation.
 */

export const useUploadAndUpdateAppDetails = ({ onSuccess }: Props) => {
  const queryClient = useQueryClient()
  const { app } = useCurrentAppInfo()

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId: app?.id as string,
    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: getXAppMetadataQueryKey(app?.metadataURI),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppMetadataQueryKey(app?.metadataURI),
      })
      updateAppDetailsMutation.resetStatus()
      onSuccess()
    },
  })
  const uploadMetadataMutation = useUploadAppMetadata()

  return {
    updateAppDetailsMutation,
    uploadMetadataMutation,
  }
}
