import { useMediaQuery, Dialog, Portal, CloseButton, Box, Grid, GridItem } from "@chakra-ui/react"
import Image from "next/image"

import B3TRLogo from "@/components/Icons/svg/b3tr.svg"

import { BaseBottomSheet } from "./BaseBottomSheet"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaTitle?: string
  ariaDescription?: string
  modalProps?: Partial<Dialog.RootProps>
  modalContentProps?: Partial<Dialog.ContentProps>
  showCloseButton?: boolean
  isCloseable?: boolean
  title?: string | React.ReactNode
  illustration?: string
  footer?: React.ReactNode
  description?: string | React.ReactNode
  showLogo?: boolean
  showHeader?: boolean
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  ariaTitle,
  ariaDescription,
  modalProps,
  modalContentProps,
  showCloseButton = false,
  isCloseable = true,
  title,
  illustration,
  footer,
  description,
  showLogo = false,
  showHeader = true,
}: Props) => {
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])
  if (isDesktop)
    return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={details => {
          if (!details.open) onClose()
        }}
        size="lg"
        scrollBehavior="inside"
        trapFocus={false}
        closeOnEscape={isCloseable}
        closeOnInteractOutside={isCloseable}
        unmountOnExit
        {...modalProps}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content rounded={"2xl"} maxH="80vh" overflowY="auto" {...modalContentProps}>
              {showHeader && (
                <Dialog.Header asChild>
                  <Grid
                    templateRows={illustration ? "1fr 1fr" : "1fr"}
                    templateColumns={"36px 1fr 36px"}
                    placeItems="start"
                    justifyItems="center">
                    <GridItem>
                      {showLogo ? <Image alt="b3tr-logo" src={B3TRLogo} width="36" height="36" /> : <Box w="9" h="9" />}
                    </GridItem>
                    <GridItem rowSpan={2}>
                      {illustration && (
                        <Box position="relative" boxSize={{ base: "16", md: "48" }}>
                          <Image alt="mascot-welcoming" src={illustration} fill />
                        </Box>
                      )}
                    </GridItem>

                    <GridItem>
                      {isCloseable && showCloseButton ? (
                        <Dialog.CloseTrigger asChild position="static">
                          <CloseButton size="md" />
                        </Dialog.CloseTrigger>
                      ) : (
                        <Box w="9" h="9" />
                      )}
                    </GridItem>
                  </Grid>
                </Dialog.Header>
              )}
              <Dialog.Body textAlign={illustration ? "center" : "left"} py={4}>
                {title && (
                  <Dialog.Title fontWeight="bold" textStyle={{ base: "xl", md: illustration ? "3xl" : "xl" }}>
                    {title}
                  </Dialog.Title>
                )}
                {description && <Dialog.Description my="9"> {description}</Dialog.Description>}
                {children}
              </Dialog.Body>
              {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    )

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={ariaTitle ?? ""}
      isDismissable={isCloseable}
      ariaDescription={ariaDescription ?? ""}
      footer={footer}
      title={title}
      illustration={illustration}
      showCloseButton={showCloseButton}
      description={description}>
      {children}
    </BaseBottomSheet>
  )
}
