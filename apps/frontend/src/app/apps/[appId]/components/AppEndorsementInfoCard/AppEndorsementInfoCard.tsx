import { useAppEndorsementScore, useEndorsementScoreThreshold } from "@/api"
import { VeBetterIcon } from "@/components"
import { Box, Button, Card, CardBody, CardHeader, Divider, Heading, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  appId: string | undefined
}

export const AppEndorsementInfoCard = ({ appId }: Props) => {
  const { t } = useTranslation()

  const { data: appEndorsementScore } = useAppEndorsementScore(appId ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()

  return (
    <Card h="full" w="100%" borderRadius="12px" boxShadow="0px 0px 7.9px 0px #F29B3280">
      <CardHeader>
        <Heading fontSize="24px" fontWeight="bold">
          {t("Endorsement")}
        </Heading>
        <Text pt={2} color="gray.600">
          {t("A dApp has to reach <strong> {{value}} endorsement points</strong> to join allocations.", {
            value: endorsementScoreThreshold,
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
                {appEndorsementScore}
              </Text>
              <Text fontSize="lg" color="gray.600" ml={1}>
                {t("of {{value}}", { value: endorsementScoreThreshold })}
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
            <Button leftIcon={<VeBetterIcon size={25} />} w="full" borderRadius="full" py={6} fontSize="md">
              {t("Look for endorsers")}
            </Button>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
