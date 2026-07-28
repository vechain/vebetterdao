import { useTranslation } from "react-i18next"

import { useEndedChallenges } from "@/api/challenges/useEndedChallenges"

import { ChallengesGrid } from "./ChallengesGrid"

export const PastTab = () => {
  const { t } = useTranslation()
  const ended = useEndedChallenges()

  return (
    <ChallengesGrid
      items={ended.items}
      section={ended}
      emptyDescription={t("B3MO Quests show up here once they end")}
    />
  )
}
