import { AppVotesGiven } from "@/api"
import { HStack, VStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { AppVotedBox } from "./AppVotedBox"

type Props = {
  votedApps: AppVotesGiven[]
  isMoreTopVotedApps: boolean
  onSeeAllAppsVoted?: () => void
}

export const TopVotedApps = ({ votedApps, isMoreTopVotedApps, onSeeAllAppsVoted }: Props) => {
  const { t } = useTranslation()

  return (
    <VStack w={"full"}>
      <HStack w={"full"} justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
        <Text fontSize={{ base: 18, md: 20 }} fontWeight={"bold"}>
          {t("Most Voted Apps")}
        </Text>
        {isMoreTopVotedApps && (
          <HStack color={"#004CFC"} cursor={"pointer"} onClick={onSeeAllAppsVoted}>
            <Text fontSize={{ base: 14, md: 16 }}>{t("See All")}</Text>
            <FiArrowUpRight size={16} />
          </HStack>
        )}
      </HStack>
      <VStack w={"full"} gap={4}>
        {votedApps.map(app => (
          <AppVotedBox key={app.appId} appVoted={app} />
        ))}
      </VStack>
    </VStack>
  )
}
