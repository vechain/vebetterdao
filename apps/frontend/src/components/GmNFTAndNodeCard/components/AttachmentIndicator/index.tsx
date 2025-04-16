import { Circle, Flex, Image } from "@chakra-ui/react"

interface AttachmentIndicatorProps {
  isXNodeAttachedToGM: boolean
  isGMOwned: boolean
  isAbove800: boolean | undefined
}

export const AttachmentIndicator = ({ isXNodeAttachedToGM, isGMOwned, isAbove800 }: AttachmentIndicatorProps) => {
  return (
    <Flex
      ml={isGMOwned ? "-10px" : "-9px"}
      mr={"-10px"}
      my={"-10px"}
      position={"relative"}
      align="center"
      justify="center">
      <Image
        src={isXNodeAttachedToGM ? "/assets/images/nft-attachment.webp" : "/assets/images/nft-attachment-off.webp"}
        alt="nft-attachment"
        w="50px"
        h="50px"
        transform={isAbove800 ? undefined : "rotate(90deg)"}
      />
      {isAbove800 && isXNodeAttachedToGM && (
        <>
          <Flex h="62px" w="1px" bg="#B1F16C" position={"absolute"} bottom="50%" left="50%" />
          <Circle size="6px" bg="#B1F16C" position={"absolute"} top="-12px" left="calc(50% - 3px)" />
        </>
      )}
    </Flex>
  )
}
