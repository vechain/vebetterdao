import imageCompression, { Options as CompressOptions } from "browser-image-compression"

export const imageCompressionOptions: CompressOptions = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

export const handleImageCompression = async (file: File): Promise<File> => {
  console.info(`originalFile size ${file.size / 1024 / 1024} MB`)

  console.info("Mime: ", file.type)
  const parsedFile = await imageCompression(file, imageCompressionOptions)
  console.info(`compressFile size ${parsedFile.size / 1024 / 1024} MB`)
  return parsedFile
}

export const imageListCompression = async (images: File[]) => {
  const compressedImages: File[] = []
  for (const image of images) {
    const parsedFile = await handleImageCompression(image)
    compressedImages.push(parsedFile)
  }
  return compressedImages
}
