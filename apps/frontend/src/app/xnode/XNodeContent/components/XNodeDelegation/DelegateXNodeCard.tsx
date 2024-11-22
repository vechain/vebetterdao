import { useIsXNodeDelegated, useXNode } from "@/api"
import { Card, CardBody, VStack, Heading, Text, Button, useDisclosure } from "@chakra-ui/react"
import { UilTimes, UilArrowUpRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { DelegateXNodeModal } from "./DelegateXNodeModal"

export const DelegateXNodeCard = () => {
  const { t } = useTranslation()
  const { xNodeId } = useXNode()
  const { data: isXNodeDelegated } = useIsXNodeDelegated(xNodeId)

  const delegateModal = useDisclosure()
  const revokeModal = useDisclosure()

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <Heading fontSize="lg">{t(isXNodeDelegated ? "XNode delegation" : "Delegate your XNode")}</Heading>
            {isXNodeDelegated ? (
              <Text fontSize="sm">{t("Your XNode is currently delegated to another address")}</Text>
            ) : (
              <Text fontSize="sm">
                {t(
                  "Delegate your XNode to the account you use on VeBetterDAO to endorse apps or participate in governance.",
                )}
              </Text>
            )}
          </VStack>

          {isXNodeDelegated ? (
            <Button leftIcon={<UilTimes color="#C84968" />} color="#C84968" variant="link" onClick={revokeModal.onOpen}>
              {t("Revoke delegation")}
            </Button>
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
      {/* <RevokeXNodeDelegationModal isOpen={revokeModal.isOpen} onClose={revokeModal.onClose} /> */}
    </Card>
  )
}
