import { useIpfsImage } from "@/api/ipfs"
import { AttachmentFile } from "@/hooks"
import { convertUriToUrl, toIPFSURL } from "@/utils"
import { Box, Button, Card, HStack, Icon, Image, Text, VStack } from "@chakra-ui/react"
import { LuDownload, LuFile } from "react-icons/lu"

export const FileAttachmentPreview = ({ attachment, uniqueKey }: { attachment: AttachmentFile; uniqueKey: number }) => {
  const { data: previewImage } = useIpfsImage(toIPFSURL(attachment.ipfs))

  const goToFile = (ipfsHash: string) => {
    const ipfsUrl = toIPFSURL(ipfsHash)
    const downloadUrl = convertUriToUrl(ipfsUrl)
    window.open(downloadUrl, "_blank")
  }

  return (
    <Card.Root
      key={`${attachment.name}-${uniqueKey}`}
      variant="baseWithBorder"
      borderColor="border.secondary"
      borderRadius={"16px"}
      onClick={() => goToFile(attachment.ipfs)}
      cursor="pointer">
      <Card.Body py={3} px={4} m={0}>
        <HStack justify="space-between">
          <HStack gap={3}>
            <Box
              bg={previewImage?.image ? "transparent" : "gray.100"}
              p={previewImage?.image ? 0 : 3}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center">
              {previewImage?.image ? (
                <Image src={previewImage.image} alt={attachment.name} boxSize="35px" />
              ) : (
                <Icon as={LuFile} color="gray.500" />
              )}
            </Box>
            <VStack align="flex-start">
              <Text fontSize="sm" fontWeight="medium">
                {attachment.name}
              </Text>
            </VStack>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            borderColor="border.subtle"
            color="text.default"
            onClick={() => goToFile(attachment.ipfs)}>
            <Icon as={LuDownload} />
          </Button>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
