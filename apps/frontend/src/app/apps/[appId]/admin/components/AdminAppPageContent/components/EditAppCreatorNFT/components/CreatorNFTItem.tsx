import { CustomModalContent, ExclamationTriangle } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import {
  Button,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalOverlay,
  Show,
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
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: vnsData } = useVechainDomain(creator)
  const domain = vnsData?.domain
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalBody p={"40px"}>
            <VStack align="center" gap="20px">
              <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
              <Heading fontSize={["xl", "2xl"]} fontWeight={700} textAlign={"center"}>
                {t("Delete {{address}} as creator?", { address: domain || humanAddress(creator, 4, 4) })}
              </Heading>
              <Text color="#6A6A6A" textAlign={"center"}>
                {t(
                  "The user will not be able to join the Discord channels, participate in the endorsement phases, and submit new apps.",
                )}
              </Text>
              {domain && (
                <Text color="#6A6A6A" textAlign={"center"}>
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
          </ModalBody>
        </CustomModalContent>
      </Modal>
      <HStack gap={6} justify={"space-between"}>
        <Show above={"sm"}>
          <HStack>
            <AddressIcon address={creator} h="48px" w="48px" rounded={"full"} />
            <VStack align="stretch" gap={0}>
              <Text fontSize={"12px"} color="#6A6A6A" fontWeight={600}>
                {domain}
              </Text>
              <Text fontSize={"14px"} color="#6A6A6A">
                {creator}
              </Text>
            </VStack>
          </HStack>
          <Button variant="dangerGhost" leftIcon={<UilTrash size={"14px"} color="#D23F63" />} onClick={onOpen}>
            {t("Remove")}
          </Button>
        </Show>
        <Show below={"sm"}>
          <HStack>
            <AddressIcon address={creator} h="36px" w="36px" rounded={"full"} />
            <VStack align="stretch" gap={0}>
              <Text fontSize={"12px"} color="#6A6A6A" fontWeight={600}>
                {domain}
              </Text>
              <Text fontSize={"14px"} color="#6A6A6A">
                {humanAddress(creator, 8, 6)}
              </Text>
            </VStack>
          </HStack>
          <IconButton
            variant="dangerGhost"
            aria-label="Remove"
            icon={<UilTrash size={"14px"} color="#D23F63" />}
            onClick={onOpen}
          />
        </Show>
      </HStack>
    </>
  )
}
