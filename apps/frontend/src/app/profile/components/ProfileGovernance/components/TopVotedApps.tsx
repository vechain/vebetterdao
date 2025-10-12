import { AppVotesGiven } from "@/api"
import { HStack, VStack, Text, Card, Button } from "@chakra-ui/react"
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
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <HStack w={"full"} alignItems="center" justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
            {t("Most Voted Apps")}
          </Text>
          {isMoreTopVotedApps && (
            <Button variant="ghost" size="sm" color="actions.tertiary.default" onClick={onSeeAllAppsVoted}>
              <Text textStyle="sm" color="actions.tertiary.default" fontWeight="semibold">
                {t("See All")}
              </Text>
              <FiArrowUpRight size={16} />
            </Button>
          )}
        </HStack>
        <VStack w={"full"} gap={4}>
          {votedApps.map(app => (
            <AppVotedBox key={app.appId} appVoted={app} />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
