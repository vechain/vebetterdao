import { useGetNodeDelegationDetails, useIsXNodeDelegated, useXNode } from "@/api"
import { Card, CardBody, VStack, Heading, Text, Button, useDisclosure, HStack, Stack, Divider } from "@chakra-ui/react"
import { UilTimes, UilArrowUpRight } from "@iconscout/react-unicons"
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
  const { xNodeId } = useXNode()
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
            <Heading fontSize="lg">{t(isXNodeDelegated ? "XNode delegation" : "Delegate your XNode")}</Heading>
            {isXNodeDelegated ? (
              <Text fontSize="sm">{t("XNode is currently delegated")}</Text>
            ) : (
              <Text fontSize="sm">
                {t(
                  "Delegate your XNode to the account you use on VeBetterDAO to endorse apps or participate in governance.",
                )}
              </Text>
            )}
          </VStack>

          {nodeDelegationDetails?.isDelegated ? (
            isOwner ? (
              <VStack align="stretch" gap={4}>
                <Stack
                  direction={["column", "column", "row"]}
                  justify={"space-between"}
                  bg="#F8F8F8"
                  rounded="xl"
                  p={3}
                  gap={[2, 2, 6]}>
                  <HStack gap={4}>
                    <AddressIcon address={nodeDelegationDetails.delegatee} w={12} h={12} rounded="full" />
                    <VStack align="start" gap={0}>
                      <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                        {delegateeDomain
                          ? humanDomain(delegateeDomain, 4, 26)
                          : humanAddress(nodeDelegationDetails.delegatee, 4, 4)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Button
                    leftIcon={<UilTimes color="#C84968" />}
                    color="#C84968"
                    variant="link"
                    onClick={revokeModal.onOpen}>
                    {t("Revoke delegation")}
                  </Button>
                </Stack>
              </VStack>
            ) : (
              <VStack align="stretch" gap={4}>
                <Divider />
                <Text fontSize="sm">{t("Delegated by")}</Text>
                <Stack
                  direction={["column", "column", "row"]}
                  justify={"space-between"}
                  bg="#F8F8F8"
                  rounded="xl"
                  p={3}
                  gap={[2, 2, 6]}>
                  <HStack gap={4}>
                    <AddressIcon address={nodeDelegationDetails.delegatee} w={12} h={12} rounded="full" />
                    <VStack align="start" gap={0}>
                      <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                        {ownerDomain
                          ? humanDomain(ownerDomain, 4, 26)
                          : humanAddress(nodeDelegationDetails.owner, 4, 4)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Button
                    leftIcon={<UilTimes color="#C84968" />}
                    color="#C84968"
                    variant="link"
                    onClick={revokeModal.onOpen}>
                    {t("Revoke delegation")}
                  </Button>
                </Stack>
              </VStack>
            )
          ) : (
            <Button
              leftIcon={<UilArrowUpRight color="#004CFC" />}
              variant="primarySubtle"
              onClick={delegateModal.onOpen}>
              {t("Delegate")}
            </Button>
          )}
        </VStack>
      </CardBody>

      <DelegateXNodeModal modal={delegateModal} />
      <RevokeXNodeDelegationModal modal={revokeModal} />
    </Card>
  )
}
