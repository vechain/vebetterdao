import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { InfoStep, InfoStepsCard } from "@/components/InfoStepsCard"

export const ChallengeStepsCard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()

  const steps = useMemo<InfoStep[]>(
    () => [
      {
        key: "what",
        title: t("B3MO Quests"),
        image: "/assets/mascot/16_Exercise.webp",
        heading: t("1. What are B3MO Quests?"),
        listItems: [
          t(
            "B3MO Quests are reward-based quests powered by B3MO. Compete with friends, sponsor someone you want to motivate, or take on app-sponsored B3MO quests - all with B3TR on the line.",
          ),
          t(
            "B3MO holds funds, verifies your actions, determines winners, and pays out automatically - every B3MO quest is fair and trustless.",
          ),
        ],
      },
      {
        key: "actions",
        title: t("Stake & compete"),
        image: "/assets/mascot/14_Phone.webp",
        heading: t("2. B3MO Quest with a Friend"),
        listItems: [
          t(
            "Create a B3MO Quest with another user. Both of you stake B3TR and compete by completing sustainable actions across chosen apps. Whoever earns more points wins the entire pool.",
          ),
          t("You can also form squads and compete team vs team - points from all members count."),
        ],
      },
      {
        key: "sections",
        title: t("Sponsor & motivate"),
        image: "/assets/mascot/13_Present.webp",
        heading: t("3. Sponsored B3MO Quests"),
        listItems: [
          t(
            "Fund a B3MO quest for someone you want to motivate - a friend, family member, or community member. They stake nothing; you deposit the B3TR reward and B3MO handles the rest.",
          ),
          t(
            "Apps can also sponsor B3MO quests to re-engage users. B3MO identifies the right targets and proposes personalised B3MO quests.",
          ),
        ],
      },
      {
        key: "explore",
        title: t("Rewards & discovery"),
        image: "/assets/mascot/B3MO_Tokens_3.png",
        heading: t("4. Earn & explore"),
        listItems: [
          t(
            "Browse open B3MO quests, track your active ones, and review your history. A small protocol fee goes to the VeBetter Treasury, fueling the DAO.",
          ),
          t(
            "Accept B3MO quests from B3MO, discover what others are doing, and never miss a B3MO quest that needs your attention.",
          ),
        ],
      },
    ],
    [t],
  )

  return <InfoStepsCard steps={steps} isOpen={isOpen} onClose={onClose} />
}
