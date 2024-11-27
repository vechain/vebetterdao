import { useGetNodeDelegationDetails, useIsXNodeDelegated, useXNode } from "@/api"
import { Card, CardBody, VStack, Heading, Text, Button, useDisclosure, HStack, Stack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { DelegateXNodeModal } from "./DelegateXNodeModal"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { RevokeXNodeDelegationModal } from "./RevokeXNodeDelegationModal"

export const DelegateXNodeCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { xNodeId, isXNodeDelegator } = useXNode()
  const { data: isXNodeDelegated } = useIsXNodeDelegated(xNodeId)
  const { data: nodeDelegationDetails } = useGetNodeDelegationDetails(xNodeId)

  const delegateModal = useDisclosure()
  const revokeModal = useDisclosure()

  const { domain: delegateeDomain } = useVechainDomain({
    addressOrDomain: nodeDelegationDetails?.delegatee,
  })
  const { domain: ownerDomain } = useVechainDomain({
    addressOrDomain: nodeDelegationDetails?.owner,
  })

  const isOwner = compareAddresses(account ?? "", nodeDelegationDetails?.owner ?? "")

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <Heading fontSize="lg">{t("Delegation")}</Heading>
            {isXNodeDelegated ? (
              <Text fontSize="sm">
                {isXNodeDelegator
                  ? t("XNode is currently delegated to:")
                  : t("XNode is currently delegated to you by:")}
              </Text>
            ) : (
              <Text fontSize="sm">
                {t(
                  "Delegate your XNode to the primary account you use on VeBetterDAO to endorse apps or participate in governance.",
                )}
              </Text>
            )}
          </VStack>

          {nodeDelegationDetails?.isDelegated ? (
            <DelegatedNodeDisplay
              address={nodeDelegationDetails.delegatee}
              displayAddress={
                isOwner
                  ? delegateeDomain
                    ? humanDomain(delegateeDomain, 4, 26)
                    : humanAddress(nodeDelegationDetails.delegatee, 4, 4)
                  : ownerDomain
                    ? humanDomain(ownerDomain, 4, 26)
                    : humanAddress(nodeDelegationDetails.owner, 4, 4)
              }
              onRevoke={revokeModal.onOpen}
            />
          ) : (
            <Button
              leftIcon={<UilArrowUpRight color="#004CFC" />}
              variant="primarySubtle"
              onClick={delegateModal.onOpen}>
              {t("Delegate XNode")}
            </Button>
          )}
        </VStack>
      </CardBody>

      <DelegateXNodeModal modal={delegateModal} />
      <RevokeXNodeDelegationModal modal={revokeModal} />
    </Card>
  )
}

const DelegatedNodeDisplay = ({
  address,
  displayAddress,
  onRevoke,
}: {
  address: string
  displayAddress: string
  onRevoke: () => void
  buttonFullWidth?: boolean
}) => {
  const { t } = useTranslation()

  return (
    <VStack align="stretch" gap={4}>
      <Stack
        direction={["column", "column", "row"]}
        justify="space-between"
        alignItems={"center"}
        bg="#F8F8F8"
        rounded="xl"
        p={3}
        w="full"
        gap={[2, 2, 6]}>
        <HStack gap={4} w="full">
          <AddressIcon address={address} w={12} h={12} rounded="full" />
          <VStack align="start" gap={0}>
            <Text fontWeight="600" fontSize={["md", "md", "lg"]}>
              {displayAddress}
            </Text>
          </VStack>
        </HStack>
        <Button variant="dangerGhost" colorScheme="red" onClick={onRevoke} w={"fit-content"}>
          {t("Cancel delegation")}
        </Button>
      </Stack>
    </VStack>
  )
}
