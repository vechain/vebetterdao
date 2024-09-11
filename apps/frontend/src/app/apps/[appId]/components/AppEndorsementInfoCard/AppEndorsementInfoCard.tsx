import { VeBetterIcon } from "@/components"
import { Box, Button, Card, CardBody, CardHeader, Divider, Heading, Stack, Text, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"

type AppEndorsementInfoCardProps = {
  endorsementThreshold: number
  currentScore: number
}

// type AppEndorsementInfoCardModalProps = AppEndorsementInfoCardProps & {
//   listOfEndorsements: string[]
// }

const defaultEndorsements = [
  { name: "Mark", date: "2023-01-01", points: 90, address: "0x1234567890" },
  { name: "John", date: "2023-01-02", points: 80, address: "0x1234567890" },
  { name: "Jane", date: "2023-01-03", points: 85, address: "0x1234567890" },
]

const XApps = [{ scoreTotal: 100 }]

export const AppEndorsementInfoCard = ({ endorsementThreshold, currentScore }: AppEndorsementInfoCardProps) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Card h="full" w="100%" borderRadius="12px" boxShadow="0px 0px 7.9px 0px #F29B3280">
      <CardHeader>
        <Heading fontSize="24px" fontWeight="bold">
          {t("Endorsement")}
        </Heading>
        <Text pt={2} color="gray.600">
          {t("A dApp has to reach <strong> {{value}} endorsement points</strong> to join allocations.", {
            value: endorsementThreshold,
          })}
          <Text as="span" color="blue.500" cursor="pointer">
            {t("Know more")}
          </Text>
        </Text>
      </CardHeader>
      <CardBody>
        <Stack spacing={5} w="full">
          <Box>
            <Text fontSize="lg">{t("Current score")}</Text>
            <Box display="flex" alignItems="center">
              <Text fontSize="4xl" mb={2} fontWeight="bold" color="orange.400">
                {currentScore}
              </Text>
              <Text fontSize="lg" color="gray.600" ml={1}>
                {t("of {{value}}", { value: endorsementThreshold })}
              </Text>
            </Box>
          </Box>
          <Divider />
          <Box pt={3}>
            <Text fontWeight="600" textAlign="center">
              {t("Nobody is endorsing your app")}
            </Text>
          </Box>
          <Box textAlign="center">
            <Button
              onClick={onOpen}
              leftIcon={<VeBetterIcon size={25} />}
              w="full"
              borderRadius="full"
              py={6}
              fontSize="md">
              {t("Look for endorsers")}
            </Button>
            <AppEndorsementInfoCardModal
              isOpen={isOpen}
              onClose={onClose}
              listOfEndorsements={defaultEndorsements}
              XApps={XApps}
            />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
