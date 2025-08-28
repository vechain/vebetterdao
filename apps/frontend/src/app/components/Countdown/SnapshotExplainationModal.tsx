import { Dialog, Heading, VStack, Text, Image, Box, Button, Portal, CloseButton, Card } from "@chakra-ui/react"
import { t } from "i18next"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const SnapshotExplainationModal = ({ isOpen, onClose }: Props) => {
  const steps = [
    {
      title: t("Convert your B3TR to VOT3"),
      image: "/assets/tokens/b3tr-to-vot3.webp",
    },
    {
      title: t("Cast your vote to your favorite app"),
      image: "/assets/icons/vote-icon.webp",
    },
    {
      title: t("Claim your rewards"),
      image: "/assets/icons/claim-b3tr-icon.webp",
    },
  ]

  const LINK_TO_DOCS = () => {
    window.open("https://docs.vebetterdao.org/vebetterdao/x2earn-allocations", "_blank", "noopener")
  }

  const renderStep = (step: number) => (
    <Text textStyle="xs" color={"#6A6A6A"}>
      {t("STEP {{value}}", { value: step })}
    </Text>
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"lg"}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded={"20px"} pt={10} px={3}>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Header pt={0}>
              <Heading size={["2xl", "4xl"]}>{t("What is a snapshot ?")}</Heading>
            </Dialog.Header>
            <Dialog.Body alignItems={"center"}>
              <VStack alignItems={"center"} gap={8}>
                <Text fontSize={["sm", "lg"]}>
                  {t(
                    "When a voting rounds begin, a record of the total supply of VOT3 tokens and each holder’s balance is taken to calculate individual voting power.",
                  )}
                </Text>
                <Text fontSize={["sm", "lg"]}>
                  {t("Swap your B3TR for VOT3 before the snapshot to increase your voting power.")}
                </Text>

                <VStack
                  w={"full"}
                  h={"full"}
                  justifyContent={"space-between"}
                  alignItems={"flex-start"}
                  gap={[2, 2, 4]}>
                  {steps.map(step => (
                    <Card.Root
                      key={step.title}
                      flexDirection={"row"}
                      variant="subtle"
                      w="full"
                      alignItems="center"
                      p={2}
                      bg={"info-bg"}
                      borderRadius={"9px"}>
                      <Box boxSize={["70px", "100px"]} alignItems={"start"}>
                        <Image boxSize={["70px", "100px"]} src={step.image} alt={step.title} />
                      </Box>
                      <VStack gap={0} alignItems={"start"} p={1}>
                        {renderStep(1)}
                        <Text textStyle={["xs", "md"]}>{step.title}</Text>
                      </VStack>
                    </Card.Root>
                  ))}
                </VStack>

                <Button variant="primaryAction" w={"full"} onClick={LINK_TO_DOCS}>
                  {t("Learn more")}
                </Button>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer></Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
