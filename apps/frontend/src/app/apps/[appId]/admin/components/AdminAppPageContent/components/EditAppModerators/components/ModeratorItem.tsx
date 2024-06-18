import { CustomModalContent, ExclamationTriangle } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import { Button, HStack, Heading, Modal, ModalBody, ModalOverlay, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

type Props = {
  moderator: string
  handleDeleteModerator: () => void
}

export const ModeratorItem = ({ moderator, handleDeleteModerator }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalBody p={"40px"}>
            <VStack align="center" gap="20px">
              <ExclamationTriangle color="#D23F63" size={230} />
              <Heading fontSize="28px" fontWeight={700}>
                {t("Delete {{address}} as moderator?", { address: humanAddress(moderator, 4, 4) })}
              </Heading>
              <Text color="#6A6A6A" textAlign={"center"}>
                {t("The user will not be able to access the dApp edition mode anymore.")}
              </Text>
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
        <HStack>
          <AddressIcon address={moderator} h="48px" w="48px" rounded={"full"} />
          <Text fontSize={"14px"} color="#6A6A6A">
            {moderator}
          </Text>
        </HStack>
        <Button variant="dangerGhost" leftIcon={<UilTrash size={"14px"} color="#D23F63" />} onClick={onOpen}>
          {t("Remove")}
        </Button>
      </HStack>
    </>
  )
}
