import { Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa6"

export const B3TRFaucet = () => {
  const { t } = useTranslation()

  const claimB3TR = () => {
    console.log("Claim B3TR")
  }

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{t("B3TR Faucet")}</Heading>
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            <Text fontSize={"14px"}>{t("You can still claim 3 times today.")}</Text>
            <Button variant="primaryAction" onClick={claimB3TR} leftIcon={<FaPlus />}>
              {t("Claim B3TR")}
            </Button>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
