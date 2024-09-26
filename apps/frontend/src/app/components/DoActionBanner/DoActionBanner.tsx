import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DoActionModal } from "./components/DoActionModal"

export const DoActionBanner = () => {
  const { t } = useTranslation()
  // TODO: get this from the backend
  const { actionsPerformed, totalActions } = {
    actionsPerformed: 6,
    totalActions: 10,
  }
  const doActionModal = useDisclosure()
  if (actionsPerformed >= totalActions) return null
  // TODO: add background image
  return (
    <Card bg="#FFD979" borderRadius="xl" maxW="400px">
      <CardBody>
        <HStack align="stretch">
          <VStack gap={2} align="stretch" justify={"space-between"}>
            <Text size="xs" color="#8D6602" fontWeight="600">
              {t("YOU ARE LAZY THIS WEEK!")}
            </Text>
            <Heading fontSize="lg" fontWeight="700" color="#5F4400">
              {t("Do some Better Actions in our apps to become able to vote!")}
            </Heading>
            <Button
              onClick={doActionModal.onOpen}
              borderRadius="full"
              bg="transparent"
              border="1px solid #5F4400"
              _hover={{
                bg: "#5F440020",
              }}>
              <Text color="#5F4400" fontWeight="500">
                {t("Tell me more")}
              </Text>
            </Button>
          </VStack>
          <Image src="/images/robot-alert-full.png" alt="Pending actions" w={20} />
        </HStack>
      </CardBody>
      <DoActionModal doActionModal={doActionModal} />
    </Card>
  )
}
