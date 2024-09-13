import { useAppEndorsementScore, useAppEndorsers, useAppExists, useEndorsementScoreThreshold } from "@/api"
import { VeBetterIcon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { AddressIcon } from "@/components/AddressIcon"

type Props = {
  appId: string | undefined
}

enum AppEndorsementStatus {
  NEW_UNENDORSED = "NEW_UNENDORSED",
  ENDORSED = "ENDORSED",
  ENDORSEMENT_LOST = "ENDORSEMENT_LOST",
  UNKNOWN = "UNKNOWN",
}

function getAppEndorsementStatus(
  appExists?: boolean,
  appEndorsementScore?: string,
  endorsementScoreThreshold?: string,
): AppEndorsementStatus {
  if (appExists === undefined || appEndorsementScore === undefined || endorsementScoreThreshold === undefined) {
    return AppEndorsementStatus.UNKNOWN
  }

  const appEndorsementScoreNumber = parseInt(appEndorsementScore, 10)
  const endorsementScoreThresholdNumber = parseInt(endorsementScoreThreshold, 10)

  if (isNaN(appEndorsementScoreNumber) || isNaN(endorsementScoreThresholdNumber)) {
    return AppEndorsementStatus.UNKNOWN
  }

  if (appEndorsementScoreNumber < endorsementScoreThresholdNumber) {
    return appExists ? AppEndorsementStatus.ENDORSEMENT_LOST : AppEndorsementStatus.NEW_UNENDORSED
  }

  return AppEndorsementStatus.ENDORSED
}

type scoreColorScheme = {
  cardBorderColor: string
  cardBoxShadow?: string
  textColor: string
}

function getScoreColorScheme(appEndorsementStatus: string): scoreColorScheme {
  // Gray
  const DEFAULT_STYLE = { cardBorderColor: "#D5D5D5", textColor: "#6A6A6A" }
  // Red
  const FAILURE_STYLE = { cardBorderColor: "#C84968", cardBoxShadow: "0px 0px 5px 0px #D23F6366", textColor: "#C84968" }
  // Yellow
  const WARNING_STYLE = {
    cardBorderColor: "#FFE4C3",
    cardBoxShadow: "0px 0px 7.9px 0px #F29B3280",
    textColor: "#F29B32",
  }
  // Green
  const SUCCESS_STYLE = { cardBorderColor: "#D5D5D5", textColor: "#3DBA67" }

  switch (appEndorsementStatus) {
    case AppEndorsementStatus.NEW_UNENDORSED:
      return WARNING_STYLE
    case AppEndorsementStatus.ENDORSEMENT_LOST:
      return FAILURE_STYLE
    case AppEndorsementStatus.ENDORSED:
      return SUCCESS_STYLE
    default:
      return DEFAULT_STYLE
  }
}

export const AppEndorsementInfoCard = ({ appId }: Props) => {
  const { t } = useTranslation()

  const { data: appEndorsementScore } = useAppEndorsementScore(appId ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()
  const { data: appEndorsers } = useAppEndorsers(appId ?? "")
  const { data: appExists } = useAppExists(appId ?? "")

  // Figure out the current endorsement status to determine the color scheme
  const appEndorsementStatus = getAppEndorsementStatus(appExists, appEndorsementScore, endorsementScoreThreshold)
  const scoreColorScheme = getScoreColorScheme(appEndorsementStatus)

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure()

  const defaultEndorsements = [
    { name: "Mark", date: "2023-01-01", points: 90, address: "0x1234567890" },
    { name: "John", date: "2023-01-02", points: 80, address: "0x1234567890" },
    { name: "Jane", date: "2023-01-03", points: 85, address: "0x1234567890" },
  ]
  const XApps = [{ scoreTotal: 100 }]

  return (
    <Card
      h="full"
      w="100%"
      p="24px"
      gap="24px"
      border="1px"
      borderRadius="12px"
      borderColor={scoreColorScheme.cardBorderColor}
      boxShadow={scoreColorScheme.cardBoxShadow}>
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
          <Link pl={1} color="#004CFC">
            {t("Know more")}
          </Link>
        </Text>
      </CardHeader>
      <CardBody p={0}>
        <Stack spacing={3} w="full">
          <Box>
            <Text fontSize="16px">{t("Current score")}</Text>
            <Box display="flex" alignItems="center">
              <Text fontSize="36px" fontWeight="700" color={scoreColorScheme.textColor}>
                {appEndorsementScore}
              </Text>
              <Text fontSize="14px" color="#6A6A6A" pt={4} pl={1}>
                {t("of {{value}}", { value: endorsementScoreThreshold })}
              </Text>
            </Box>
          </Box>
          <Divider />
          <Box textAlign="center">
            {appEndorsers && appEndorsers.length ? (
              <HStack justify={"space-between"}>
                <Box>
                  {appEndorsers.map((endorser: string, index: number) => (
                    <Box key={index}>
                      <AddressIcon address={endorser} rounded="full" h="20px" w="20px" />
                    </Box>
                  ))}
                </Box>
                <Text as="span" fontSize="14px" fontWeight="bold">
                  {appEndorsers.length > 1
                    ? t("{{value}}-x-node-users", { value: appEndorsers.length })
                    : t("1-x-node-user")}
                </Text>
                <Link fontSize="14px" color="#004CFC">
                  {t("See all")}
                </Link>
              </HStack>
            ) : (
              <Text fontSize="14px" fontWeight="bold">
                {t("Nobody is endorsing your app")}
              </Text>
            )}
          </Box>
          <Box textAlign="center" py={6}>
            <Button
              onClick={onOpen}
              leftIcon={<VeBetterIcon color="#004CFC" size={16} />}
              w="full"
              borderRadius="full"
              color="#E0E9FE"
              display="flex"
              alignItems="center">
              <Text fontSize="18px" fontWeight="500" color="#004CFC">
                {t("Look for endorsers")}
              </Text>
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
