import { useMediaQuery, Dialog, Portal, CloseButton } from "@chakra-ui/react"
import { BaseBottomSheet } from "./BaseBottomSheet"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaTitle?: string
  ariaDescription?: string
  modalProps?: Partial<Dialog.RootProps>
  modalContentProps?: Partial<Dialog.ContentProps>
  modalBodyProps?: Partial<Dialog.BodyProps>
  showCloseButton?: boolean
  isCloseable?: boolean
}
export const BaseModal = ({
  isOpen,
  onClose,
  children,
  ariaTitle,
  ariaDescription,
  modalProps,
  modalContentProps,
  modalBodyProps,
  showCloseButton = false,
  isCloseable = true,
}: Props) => {
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])

  if (isDesktop)
    return (
      <Dialog.Root
        variant="base"
        open={isOpen}
        onOpenChange={details => {
          if (!details.open) {
            onClose()
          }
        }}
        size="xl"
        placement="center"
        trapFocus={false}
        {...modalProps}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content rounded={"2xl"} {...modalContentProps}>
              {isCloseable && showCloseButton ? (
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="md" />
                </Dialog.CloseTrigger>
              ) : null}
              <Dialog.Body p={10} rounded={"2xl"} {...modalBodyProps}>
                {children}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    )

  return (
    <BaseBottomSheet
      {...(modalContentProps?.bgColor ? { customBgColor: modalContentProps.bgColor as string } : {})}
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={ariaTitle ?? ""}
      isDismissable={isCloseable}
      ariaDescription={ariaDescription ?? ""}>
      {children}
    </BaseBottomSheet>
  )
}
