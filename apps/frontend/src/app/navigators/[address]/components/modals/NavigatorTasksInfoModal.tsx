import { Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuFileText, LuShieldAlert, LuTimer, LuVote } from "react-icons/lu"

import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const NavigatorTasksInfoModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data: reportInterval } = useGetReportInterval()

  return (
    <BaseModal showCloseButton isCloseable ariaTitle="Navigator Responsibilities" isOpen={isOpen} onClose={onClose}>
      <VStack w="full" align="stretch" gap={5}>
        <Heading size="lg">{t("navigatorTasksInfoTitle")}</Heading>

        <InfoItem
          icon={<LuVote />}
          color="status.info.primary"
          title={t("Set allocation preferences")}
          description={t("navigatorTasksInfoPreferences")}
        />

        <InfoItem
          icon={<LuTimer />}
          color="status.info.primary"
          title={t("Vote on proposal")}
          description={t("navigatorTasksInfoProposals")}
        />

        <InfoItem
          icon={<LuFileText />}
          color="status.info.primary"
          title={t("Submit Report")}
          description={t("navigatorTasksInfoReport", { interval: reportInterval ?? 2 })}
        />

        <HStack gap={3} p={3} borderRadius="lg" bg="status.negative.subtle" align="flex-start">
          <Icon color="status.negative.primary" mt={0.5}>
            <LuShieldAlert />
          </Icon>
          <Text textStyle="xs" color="status.negative.primary">
            {t("navigatorTasksInfoSlashing")}
          </Text>
        </HStack>
      </VStack>
    </BaseModal>
  )
}

type InfoItemProps = {
  icon: React.ReactNode
  color: string
  title: string
  description: string
}

const InfoItem = ({ icon, color, title, description }: InfoItemProps) => (
  <HStack gap={3} align="flex-start">
    <Icon color={color} mt={0.5}>
      {icon}
    </Icon>
    <VStack gap={1} align="stretch">
      <Text textStyle="sm" fontWeight="semibold">
        {title}
      </Text>
      <Text textStyle="sm" color="text.subtle">
        {description}
      </Text>
    </VStack>
  </HStack>
)
