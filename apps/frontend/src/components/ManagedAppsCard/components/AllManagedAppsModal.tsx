import { AppAdministrationRole } from "@/api"
import { AppDetails } from "./AppDetails"
import { Heading, Modal, ModalBody, ModalCloseButton, ModalHeader, ModalOverlay, VStack } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { useTranslation } from "react-i18next"

type Props = {
  userAppRoles: AppAdministrationRole[]
  isOpen: boolean
  onClose: () => void
}

export const AllManagedAppsModal = ({ userAppRoles, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"} trapFocus={true} isCentered={true} closeOnOverlayClick={true}>
      <ModalOverlay />

      <CustomModalContent>
        <ModalHeader>
          <Heading size="lg">{t("Managed apps")}</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={12}>
            {userAppRoles.map((role, index) => {
              if (role.isAdmin || role.isModerator) {
                return (
                  <AppDetails appId={role.appId} isAdmin={role.isAdmin} isModerator={role.isModerator} key={index} />
                )
              }
            })}
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
