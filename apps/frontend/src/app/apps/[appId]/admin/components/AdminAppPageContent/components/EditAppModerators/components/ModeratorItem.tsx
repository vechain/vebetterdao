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
import { useVechainDomain } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

type Props = {
  moderator: string
  handleDeleteModerator: () => void
}

export const ModeratorItem = ({ moderator, handleDeleteModerator }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { domain } = useVechainDomain({ addressOrDomain: moderator })

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalBody p={"40px"}>
            <VStack align="center" gap="20px">
              <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
              <Heading fontSize={["xl", "2xl"]} fontWeight={700} textAlign={"center"}>
                {t("Delete {{address}} as moderator?", { address: domain || humanAddress(moderator, 4, 4) })}
              </Heading>
              <Text color="#6A6A6A" textAlign={"center"}>
                {t("The user will not be able to access the app edition mode anymore.")}
              </Text>
              {domain && (
                <Text color="#6A6A6A" textAlign={"center"}>
                  {`Address: ${humanAddress(moderator, 8, 6)}`}
                </Text>
              )}
              <VStack align="center" gap="20px" mt="20px">
                <Button variant="primaryAction" onClick={onClose}>
                  {t("Cancel")}
                </Button>
                <Button variant="dangerGhost" onClick={handleDeleteModerator}>
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
            <AddressIcon address={moderator} h="48px" w="48px" rounded={"full"} />
            <VStack align="stretch" gap={0}>
              <Text fontSize={"12px"} color="#6A6A6A" fontWeight={600}>
                {domain}
              </Text>
              <Text fontSize={"14px"} color="#6A6A6A">
                {moderator}
              </Text>
            </VStack>
          </HStack>
          <Button variant="dangerGhost" leftIcon={<UilTrash size={"14px"} color="#D23F63" />} onClick={onOpen}>
            {t("Remove")}
          </Button>
        </Show>
        <Show below={"sm"}>
          <HStack>
            <AddressIcon address={moderator} h="36px" w="36px" rounded={"full"} />
            <VStack align="stretch" gap={0}>
              <Text fontSize={"12px"} color="#6A6A6A" fontWeight={600}>
                {domain}
              </Text>
              <Text fontSize={"14px"} color="#6A6A6A">
                {humanAddress(moderator, 8, 6)}
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
