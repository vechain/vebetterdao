import { Button, Card, CardBody, Heading, HStack, Image, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplyNow = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant="baseWithBorder"
      w="full"
      h="full"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239AE14DFF' stroke-width='4' stroke-dasharray='16%2c 18%2c 13%2c 24' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
        borderRadius: "20px",
      }}>
      <CardBody p={0}>
        <HStack w="full">
          <Image src="/images/mascot/jump-01.png" alt="VeBetterDAO Action" />
          <Stack
            w="full"
            direction={["column", "column", "row"]}
            alignItems={["flex-start", "flex-start", "center"]}
            justifyContent={["flex-start", "flex-start", "space-between"]}
            spacing={4}
            py="16px"
            pr="24px">
            <Heading fontSize="lg" fontWeight="700" color="#252525" flex={1}>
              {t("Do you have a dApp to join the VeBetterDAO ecosystem?")}
            </Heading>
            <Button
              // onClick={doActionModal.onOpen}
              variant="primarySubtle"
              borderRadius="full"
              flexShrink={0}>
              <Text fontWeight="500">{`+ ${t("Apply now")}`}</Text>
            </Button>
          </Stack>
        </HStack>
      </CardBody>
    </Card>
  )
}
