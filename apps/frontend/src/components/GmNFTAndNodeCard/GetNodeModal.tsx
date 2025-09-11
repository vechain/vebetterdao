import { useTranslation } from "react-i18next"
import { Dialog, Button, Heading, Text, VStack, Image, Portal, SimpleGrid } from "@chakra-ui/react"

interface UpgradeGMModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GetNodeModal: React.FC<UpgradeGMModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()

  const onGetNodeClick = () => {
    onClose()
    window.open("http://app.stargate.vechain.org/", "_blank")
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"2xl"}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <VStack gap={4} align="flex-start">
                <Image src="/assets/icons/node-placeholder.svg" alt="node-placeholder" />

                <Heading fontSize="2xl">{t("Become a node holder")}</Heading>
              </VStack>
            </Dialog.Header>
            <Dialog.Body gap={[0, 4]} pt={0}>
              <Text fontSize={["16px"]}>
                {t("A VeChain Node gives you rewards, voting power in the DAO, and the ability to endorse apps.")}
                <br /> <br />
                {t(
                  "By attaching your GM NFT to a node, you can boost rewards, upgrade your NFT, and gain more influence in governance. Endorsing apps is vital for the DAO, and many apps offer perks to their endorsers. Node holders with NFTs above Flesh level also get free GM upgrades.",
                )}
              </Text>
            </Dialog.Body>

            <Dialog.Footer w="full" px={4} pt={1}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} w="full">
                <Button variant={"whiteAction"} color={"#004CFC"} onClick={onClose}>
                  {t("Maybe later")}
                </Button>
                <Button variant={"primaryAction"} onClick={onGetNodeClick}>
                  {t("Get a node")}
                </Button>
              </SimpleGrid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
