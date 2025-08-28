import { CustomModalContent, ExclamationTriangle } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import {
  Button,
  Heading,
  HStack,
  IconButton,
  Dialog,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

type Props = {
  distributor: string
  handleDeleteDistributor?: () => void
}

export const DistributorItem = ({ distributor, handleDeleteDistributor }: Props) => {
  const { t } = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const { data: vnsData } = useVechainDomain(distributor)
  const domain = vnsData?.domain

  const isDeleteable = handleDeleteDistributor !== undefined
  const iconSize = useBreakpointValue({ base: 150, sm: 230 })
  return (
    <>
      {isDeleteable && (
        <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"xl"}>
          <CustomModalContent>
            <Dialog.Body p={"40px"}>
              <VStack align="center" gap="20px">
                <ExclamationTriangle color="#D23F63" size={iconSize} />
                <Heading size={["xl", "3xl"]} textAlign={"center"}>
                  {t("Delete {{address}} as reward distributor?", {
                    address: domain ?? humanAddress(distributor, 4, 4),
                  })}
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
            </Dialog.Body>
          </CustomModalContent>
        </Dialog.Root>
      )}
      <HStack gap={6} justify={"space-between"}>
        <HStack hideBelow="md">
          <AddressIcon address={distributor} h="34px" w="34px" rounded={"full"} />
          <VStack align="stretch" gap={0}>
            <Text textStyle={"xs"} color="#6A6A6A" fontWeight={600}>
              {domain}
            </Text>
            <Text textStyle={"sm"} color="#6A6A6A">
              {distributor}
            </Text>
          </VStack>
        </HStack>
        {isDeleteable && (
          <Button variant="dangerGhost" onClick={onOpen}>
            <UilTrash size={"14px"} color="#D23F63" />
            {t("Remove")}
          </Button>
        )}

        <HStack hideBelow="md">
          <AddressIcon address={distributor} h="34px" w="34px" rounded={"full"} />
          <Text textStyle={"sm"} color="#6A6A6A">
            {humanAddress(distributor, 8, 6)}
          </Text>
        </HStack>
        {isDeleteable && (
          <IconButton variant="dangerGhost" aria-label="Remove" onClick={onOpen}>
            <UilTrash size={"14px"} color="#D23F63" />
          </IconButton>
        )}
      </HStack>
    </>
  )
}
