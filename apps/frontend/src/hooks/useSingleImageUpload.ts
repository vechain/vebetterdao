import { useState, useCallback, useEffect } from "react"
import imageCompression, { Options as CompressOptions } from "browser-image-compression"
import { imageCompressionOptions } from "./useUploadImages"

type Props = {
  compressImage?: boolean
  defaultImage?: UploadedImage
}
/**
 *  Hook to handle image uploads and compressions in a dropzone
 * @param param0  compressImags: boolean to indicate if the image should be compressed (default: true)
 * @param param1  defaultImage: default image to be displayed
 * @returns   uploaded image, setUploadedImage: function to set the uploaded image, onDrop: function to handle the drop event
 */

export type UploadedImage = {
  file: File
  image: string
}
export const useSingleImageUpload = ({ compressImage, defaultImage }: Props) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | undefined>(defaultImage)

  useEffect(() => {
    if (defaultImage) {
      setUploadedImage(defaultImage)
    }
  }, [defaultImage])

  const onRemove = useCallback(() => setUploadedImage(undefined), [])

  const onUpload = useCallback(
    async (acceptedFile: File) => {
      let parsedFile = acceptedFile
      if (compressImage) {
        parsedFile = await imageCompression(parsedFile, imageCompressionOptions)
      }

      const image: UploadedImage = {
        file: parsedFile,
        image: URL.createObjectURL(parsedFile),
      }

      setUploadedImage(image)
    },
    [compressImage],
  )

  return {
    uploadedImage,
    setUploadedImage,
    onUpload,
    onRemove,
  }
}
