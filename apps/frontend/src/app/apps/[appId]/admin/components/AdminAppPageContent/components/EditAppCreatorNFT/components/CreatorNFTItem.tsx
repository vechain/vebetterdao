import { CustomModalContent, ExclamationTriangle } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import {
  Button,
  Heading,
  HStack,
  IconButton,
  Dialog,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

type Props = {
  creator: string
  handleDeleteCreator: () => void
}

export const CreatorNFTItem = ({ creator, handleDeleteCreator }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const { data: vnsData } = useVechainDomain(creator)
  const domain = vnsData?.domain
  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"xl"}>
        <CustomModalContent>
          <Dialog.Body p={"40px"}>
            <VStack align="center" gap="20px">
              <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
              <Heading size={["xl", "2xl"]} fontWeight="bold" textAlign={"center"}>
                {t("Delete {{address}} as creator?", { address: domain || humanAddress(creator, 4, 4) })}
              </Heading>
              <Text color="text.subtle" textAlign={"center"}>
                {t(
                  "The user will not be able to join the Discord channels, participate in the endorsement phases, and submit new apps.",
                )}
              </Text>
              {domain && (
                <Text color="text.subtle" textAlign={"center"}>
                  {`Address: ${humanAddress(creator, 8, 6)}`}
                </Text>
              )}
              <VStack align="center" gap="20px" mt="20px">
                <Button variant="primaryAction" onClick={onClose}>
                  {t("Cancel")}
                </Button>
                <Button variant="dangerGhost" onClick={handleDeleteCreator}>
                  {t("Yes, remove")}
                </Button>
              </VStack>
            </VStack>
          </Dialog.Body>
        </CustomModalContent>
      </Dialog.Root>
      <HStack gap={6} justify={"space-between"}>
        <HStack hideBelow="md">
          <AddressIcon address={creator} h="48px" w="48px" rounded={"full"} />
          <VStack align="stretch" gap={0}>
            <Text textStyle={"xs"} color="text.subtle" fontWeight="semibold">
              {domain}
            </Text>
            <Text textStyle={"sm"} color="text.subtle">
              {creator}
            </Text>
          </VStack>
        </HStack>
        <Button hideBelow="md" variant="dangerGhost" onClick={onOpen}>
          <UilTrash size={"14px"} color="#D23F63" />
          {t("Remove")}
        </Button>

        <HStack hideFrom="md">
          <AddressIcon address={creator} h="36px" w="36px" rounded={"full"} />
          <VStack align="stretch" gap={0}>
            <Text textStyle={"xs"} color="text.subtle" fontWeight="semibold">
              {domain}
            </Text>
            <Text textStyle={"sm"} color="text.subtle">
              {humanAddress(creator, 8, 6)}
            </Text>
          </VStack>
        </HStack>
        <IconButton hideFrom="md" variant="dangerGhost" aria-label="Remove" onClick={onOpen}>
          <UilTrash size={"14px"} color="#D23F63" />
        </IconButton>
      </HStack>
    </>
  )
}
