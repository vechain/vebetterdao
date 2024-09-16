import { useAppEndorsementScore, useAppEndorsers, useEndorsementScoreThreshold } from "@/api"
import { VeBetterIcon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  Link,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"

type Props = {
  appId: string
}

export const AppEndorsementInfoCard = ({ appId }: Props) => {
  const { t } = useTranslation()

  const { data: appEndorsementScore } = useAppEndorsementScore(appId ?? "")
  const { data: endorsementScoreThreshold } = useEndorsementScoreThreshold()
  const { data: appEndorsers } = useAppEndorsers(appId ?? "")

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure()

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
              <Text fontSize="36px" fontWeight="700" color="#F29B32">
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
              appEndorsers
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
            <AppEndorsementInfoCardModal isOpen={isOpen} onClose={onClose} appId={appId} />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
