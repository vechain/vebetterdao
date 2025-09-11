import { AppDetails } from "./AppDetails"
import { Heading, Dialog, VStack, Portal, CloseButton } from "@chakra-ui/react"
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
    <Dialog.Root
      open={isOpen}
      onOpenChange={onClose}
      size={"xl"}
      trapFocus={true}
      placement="center"
      closeOnInteractOutside>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size="3xl">{t("Managed apps")}</Heading>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <VStack gap={12}>
                {userAppRoles.map(role => {
                  if (role.isAdmin || role.isModerator) {
                    return (
                      <AppDetails
                        appId={role.appId}
                        isAdmin={role.isAdmin}
                        isModerator={role.isModerator}
                        key={`managed-app-${role.appId}`}
                        showSeparator={true}
                      />
                    )
                  }
                })}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
