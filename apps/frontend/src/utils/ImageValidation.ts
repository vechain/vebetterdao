import { IMAGE_REQUIREMENTS } from "@/constants/XAppsMedia"

type ValidationResult = {
  isValid: boolean
  error?: string
}

export const validateImage = async (file: File, type: keyof typeof IMAGE_REQUIREMENTS): Promise<ValidationResult> => {
  const requirements = IMAGE_REQUIREMENTS[type]

  // Check MIME type
  if (file.type !== requirements.mimeType) {
    return {
      isValid: false,
      error: `File must be a ${requirements.extension.toUpperCase()} image`,
    }
  }

  // Check dimensions
  return new Promise(resolve => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { width, height } = img
      const ratio = width / height

      if (width < requirements.dimensions.minWidth || height < requirements.dimensions.minHeight) {
        resolve({
          isValid: false,
          error: `Image must be at least ${requirements.dimensions.minWidth}x${requirements.dimensions.minHeight} pixels`,
        })
        return
      }

      // Allow for small rounding differences in ratio
      const ratioTolerance = 0.01
      if (Math.abs(ratio - requirements.dimensions.ratio) > ratioTolerance) {
        resolve({
          isValid: false,
          error: `Image must have a ${requirements.dimensions.ratioString} aspect ratio`,
        })
        return
      }

      resolve({ isValid: true })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        isValid: false,
        error: "Invalid image file",
      })
    }

    img.src = objectUrl
  })
}
