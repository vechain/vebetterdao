import { Button, Card, CardBody, Heading, HStack, Image, Stack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationApproved = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant="baseWithBorder"
      w="full"
      h="full"
      style={{
        backgroundColor: "#E0E9FE",
        borderColor: "#CEDCFD",
        borderRadius: "20px",
      }}>
      <CardBody p={0}>
        <HStack w="full">
          <Image src="/images/claim-b3tr-icon.png" alt="VeBetterDAO Action" />
          <Stack
            w="full"
            direction={["column", "column", "row"]}
            alignItems={["flex-start", "flex-start", "center"]}
            justifyContent={["flex-start", "flex-start", "space-between"]}
            spacing={4}
            py="16px"
            pr="24px">
            <VStack w="full" alignItems="flex-start" flex={1} spacing={4}>
              <Heading fontSize="lg" fontWeight="700" color="#252525">
                {t("Your Creator's NFT application was approved!")}
              </Heading>
              <Text fontSize={14} fontWeight="400" color="#6A6A6A">
                {t("You can now submit your app to the VeBetterDAO ecosystem")}
              </Text>
            </VStack>
            <Button
              // onClick={doActionModal.onOpen}
              variant="primaryAction"
              borderRadius="full"
              flexShrink={0}>
              <Text fontWeight="500">{t("Submit app")}</Text>
            </Button>
          </Stack>
        </HStack>
      </CardBody>
    </Card>
  )
}
