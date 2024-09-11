import { useAppEndorsementScore, useEndorsementScoreThreshold } from "@/api"
import { VeBetterIcon } from "@/components"
import { Box, Button, Card, CardBody, CardHeader, Divider, Heading, Link, Stack, Text } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"

type Props = {
  appId: string | undefined
}

export const AppEndorsementInfoCard = ({ appId }: Props) => {
  const { t } = useTranslation()

  const { data: appEndorsementScore } = useAppEndorsementScore(appId ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()

  return (
    <Card
      h="full"
      w="100%"
      p="24px"
      gap="24px"
      border="1px"
      borderColor="#FFE4C3"
      borderRadius="12px"
      boxShadow="0px 0px 7.9px 0px #F29B3280">
      <CardHeader p={0}>
        <Heading fontSize="24px" fontWeight="bold">
          {t("Endorsement")}
        </Heading>
        <Text pt={3} fontSize="14px" color="#6A6A6A">
          <Trans
            i18nKey="A dApp has to reach {{value}} endorsement points to join allocations."
            values={{ value: endorsementScoreThreshold }}
            t={t}
          />
          <Link pl={0.5} color="#004CFC">
            {t("Know more")}
          </Link>
        </Text>
      </CardHeader>
      <CardBody p={0}>
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
