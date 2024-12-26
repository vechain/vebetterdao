import { AppDetails } from "./AppDetails"
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export type AppAdministrationRole = {
  isAdmin: boolean
  isModerator: boolean
  appId: string
}

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

      <ModalContent>
        <ModalHeader>
          <Heading size="lg">{t("Managed apps")}</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={12}>
            {userAppRoles.map(role => {
              if (role.isAdmin || role.isModerator) {
                return (
                  <AppDetails
                    appId={role.appId}
                    isAdmin={role.isAdmin}
                    isModerator={role.isModerator}
                    key={`managed-app-${role.appId}`}
                    showDivider={true}
                  />
                )
              }
            })}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
