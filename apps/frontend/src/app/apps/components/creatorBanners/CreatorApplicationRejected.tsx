import { Button, Card, CardBody, Heading, HStack, Image, Stack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationRejected = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant="baseWithBorder"
      w="full"
      h="full"
      style={{
        backgroundColor: "#FFF3E5",
        borderColor: "#F29B32",
        borderRadius: "20px",
      }}>
      <CardBody p={0}>
        <Stack
          w="full"
          direction={["column", "column", "row"]}
          alignItems={["flex-start", "flex-start", "center"]}
          justifyContent={["flex-start", "flex-start", "space-between"]}
          spacing={4}
          py="16px">
          <HStack w="full" pr="24px">
            <Image src="/images/mascot/head-only-warning.png" alt="VeBetterDAO Action" />
            <VStack w="full" alignItems="flex-start" flex={1} spacing={4}>
              <Heading fontSize="lg" fontWeight="700" color="#252525">
                {t("Your Creator's NFT application was rejected")}
              </Heading>
              <Text fontSize={14} fontWeight="400" color="#6A6A6A">
                {t("You're not cleared to receive a Creator's NFT")}
              </Text>
            </VStack>
          </HStack>
          <HStack
            w="full"
            justifyContent={["space-between", "space-between", "flex-end"]}
            alignItems="center"
            spacing={4}
            px="24px">
            <Button
              variant={"link"}
              colorScheme="primary"
              // onClick={onOpenUnendorsementModal}
            >
              {t("Contact support")}
            </Button>
            <Button
              // onClick={doActionModal.onOpen}
              variant="primaryAction"
              borderRadius="full"
              flexShrink={0}>
              <Text fontWeight="500">{t("Apply again")}</Text>
            </Button>
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
