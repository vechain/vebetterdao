import { CustomModalContent, ExclamationTriangle } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import {
  Button,
  HStack,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalOverlay,
  Show,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useBreakpointValue } from "@chakra-ui/react"
import { useVechainDomain } from "@vechain/dapp-kit-react"

type Props = {
  distributor: string
  handleDeleteDistributor: () => void
}

export const DistributorItem = ({ distributor, handleDeleteDistributor }: Props) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { domain } = useVechainDomain({ addressOrDomain: distributor })

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalBody p={"40px"}>
            <VStack align="center" gap="20px">
              <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
              <Heading fontSize={["22px", "28px"]} fontWeight={700} textAlign={"center"}>
                {t("Delete {{address}} as reward distributor?", { address: domain || humanAddress(distributor, 4, 4) })}
              </Heading>
              <Text color="#6A6A6A" textAlign={"center"}>
                {t("This address won't be able to distribute rewards anymore.")}
              </Text>
              <Text color="#6A6A6A" textAlign={"center"}>
                {`Account: ${domain ?? humanAddress(distributor, 8, 6)}`}
              </Text>
              <VStack align="center" gap="20px" mt="20px">
                <Button variant="primaryAction" onClick={onClose}>
                  {t("Cancel")}
                </Button>
                <Button variant="dangerGhost" onClick={handleDeleteDistributor}>
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
            <AddressIcon address={distributor} h="34px" w="34px" rounded={"full"} />
            <Text fontSize={"14px"} color="#6A6A6A">
              {distributor}
            </Text>
            <Text fontSize={"14px"} color="#6A6A6A" borderLeft={"1px solid"} paddingLeft={2}>
              {domain}
            </Text>
          </HStack>
          <Button variant="dangerGhost" leftIcon={<UilTrash size={"14px"} color="#D23F63" />} onClick={onOpen}>
            {t("Remove")}
          </Button>
        </Show>
        <Show below={"sm"}>
          <HStack>
            <AddressIcon address={distributor} h="34px" w="34px" rounded={"full"} />
            <Text fontSize={"14px"} color="#6A6A6A">
              {humanAddress(distributor, 8, 6)}
            </Text>
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
