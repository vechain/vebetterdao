import { notFoundImage } from "@/constants"

/**
 * Custom hook for retrieving data related to an X-Node.
 *
 * @returns An object containing the following properties:
 *  - xNodeName: The name of the X-Node.
 * - xNodeImage: The image URL of the X-Node.
 * - xNodePoints: The points of the X-Node.
 * - isXNodeHolder: A boolean indicating whether the user is an X-Node holder.
 * - isXNodeAttachedToGM: A boolean indicating whether the X-Node is attached to the GM NFT.
 * */
export const useXNode = () => {
  // TODO: map missing data
  const xNodeName = "X-Node"
  const xNodeImage = notFoundImage
  const xNodePoints = "100"
  const isXNodeHolder = true
  const isXNodeAttachedToGM = isXNodeHolder && false

  return {
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeHolder,
    isXNodeAttachedToGM,
  }
}
