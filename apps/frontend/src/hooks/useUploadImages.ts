import { useState, useCallback, useEffect } from "react"
import imageCompression, { Options as CompressOptions } from "browser-image-compression"
import dayjs, { Dayjs } from "dayjs"

export const imageCompressionOptions: CompressOptions = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

export const compressImages = async (images: UploadedImage[]) => {
  const compressedImages: File[] = []
  try {
    for (const image of images) {
      console.log(`originalFile size ${image.file.size / 1024 / 1024} MB`)

      console.log("Mime: ", image.file.type)
      const parsedFile = await imageCompression(image.file, imageCompressionOptions)
      console.log(`compressFile size ${parsedFile.size / 1024 / 1024} MB`)
      compressedImages.push(parsedFile)
    }
    return compressedImages
  } catch (e) {
    console.error("compress error", e)
    throw e
  }
}

type Props = {
  compressImages?: boolean
  defaultImages?: UploadedImage[]
  requirePictureAfterDate?: Dayjs
}
/**
 *  Hook to handle image uploads and compressions in a dropzone
 * @param param0  compressImages: boolean to indicate if the images should be compressed (default: true)
 * @returns  uploadedImages: array of uploaded images, setUploadedImages: function to set the uploaded images, onDrop: function to handle the drop event
 */

export type UploadedImage = {
  file: File
  image: string
}
export const useUploadImages = ({ compressImages, defaultImages, requirePictureAfterDate }: Props) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(defaultImages ?? [])

  useEffect(() => {
    if (defaultImages) {
      setUploadedImages(defaultImages)
    }
  }, [defaultImages])

  const [invalidDateError, setInvalidDateError] = useState<number[]>([])

  const onRemove = useCallback((index: number) => setUploadedImages(s => s.filter((_, i) => i !== index)), [])

  const onUpload = useCallback(
    async (acceptedFiles: File[], keepCurrent = true) => {
      setInvalidDateError([])

      const parsedUploads: UploadedImage[] = []
      for (const file of acceptedFiles) {
        console.log("file", file)
        let parsedFile = file
        if (requirePictureAfterDate) {
          const fileDate = dayjs(file.lastModified)
          if (fileDate.isBefore(requirePictureAfterDate)) {
            setInvalidDateError(s => [...s, acceptedFiles.indexOf(file)])
            continue
          }
        }
        if (compressImages) {
          parsedFile = await imageCompression(file, imageCompressionOptions)
        }

        const image: UploadedImage = {
          file: parsedFile,
          image: URL.createObjectURL(file),
        }
        parsedUploads.push(image)
      }

      setUploadedImages(s => [
        ...parsedUploads,
        ...(!keepCurrent ? [] : s.filter(f => !parsedUploads.some(p => p.file.name === f.file.name))),
      ])
    },
    [compressImages, requirePictureAfterDate],
  )

  return {
    uploadedImages,
    setUploadedImages,
    onUpload,
    onRemove,
    invalidDateError,
  }
}
