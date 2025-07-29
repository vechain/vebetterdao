import { useTranslation } from "react-i18next"
import { CustomModalContent } from "@/components"
import {
  Button,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  Heading,
  ModalBody,
  Text,
  ModalFooter,
  VStack,
  Stack,
} from "@chakra-ui/react"
import { UilPolygon } from "@iconscout/react-unicons"

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
    <Modal isOpen={isOpen} onClose={onClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent gap={4} p={{ base: 3, md: 5 }}>
        <ModalCloseButton />
        <ModalHeader>
          <VStack gap={4} align="flex-start">
            <UilPolygon size={"80px"} style={{ transform: "rotate(90deg)" }} />

            <Heading fontSize="2xl">{t("Become a node holder")}</Heading>
          </VStack>
        </ModalHeader>
        <ModalBody gap={[0, 4]} pt={0}>
          <Text fontSize={["16px"]}>
            {t("A VeChain Node gives you rewards, voting power in the DAO, and the ability to endorse apps.")}
            <br /> <br />
            {t(
              "By attaching your GM NFT to a node, you can boost rewards, upgrade your NFT, and gain more influence in governance. Endorsing apps is vital for the DAO, and many apps offer perks to their endorsers. Node holders with NFTs above Flesh level also get free GM upgrades.",
            )}
          </Text>
        </ModalBody>

        <ModalFooter w="full" px={4} pt={1}>
          <Stack direction={["column", "row"]} align="stretch" w="full">
            <Button variant={"whiteAction"} color={"#004CFC"} w={"full"} onClick={onClose}>
              {t("Maybe later")}
            </Button>
            <Button variant={"primaryAction"} w={"full"} onClick={onGetNodeClick}>
              {t("Get a node")}
            </Button>
          </Stack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
