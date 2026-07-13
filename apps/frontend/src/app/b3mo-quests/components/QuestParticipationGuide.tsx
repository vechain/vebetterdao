import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { InfoStep, InfoStepsCard } from "@/components/InfoStepsCard"

export interface QuestParticipationGuideProps {
  isOpen: boolean
  onClose: () => void
}

export const QuestParticipationGuide = ({ isOpen, onClose }: QuestParticipationGuideProps) => {
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
        ],
      },
      {
        key: "funding",
        title: t("Stake & compete"),
        image: "/assets/mascot/14_Phone.webp",
        heading: t("2. Choose how the Quest is funded", { defaultValue: "2. Choose how the Quest is funded" }),
        listItems: [
          t(
            "Create a B3MO Quest with another user. Both of you stake B3TR and compete by completing sustainable actions across chosen apps. Whoever earns more points wins the entire pool.",
          ),
          t(
            "Fund a B3MO quest for someone you want to motivate - a friend, family member, or community member. They stake nothing; you deposit the B3TR reward and B3MO handles the rest.",
          ),
        ],
      },
      {
        key: "winner",
        title: t("B3MO Quest type"),
        image: "/assets/mascot/13_Present.webp",
        heading: t("3. Know how winners are decided", { defaultValue: "3. Know how winners are decided" }),
        listItems: [t("Max actions description"), t("Split win description")],
      },
      {
        key: "actions",
        title: t("Active"),
        image: "/assets/mascot/16_Exercise.webp",
        heading: t("4. Complete valid actions on time", { defaultValue: "4. Complete valid actions on time" }),
        listItems: [
          t(
            "Use any of these apps to perform actions and earn points toward this B3MO Quest. Actions on apps not listed here will not count.",
          ),
          t("Only actions completed during the active Quest window count. Check each Quest's start and end rounds.", {
            defaultValue:
              "Only actions completed during the active Quest window count. Check each Quest's start and end rounds.",
          }),
        ],
      },
      {
        key: "claim",
        title: t("Available to Claim"),
        image: "/assets/mascot/B3MO_Tokens_3.png",
        heading: t("5. Claim rewards or refunds", { defaultValue: "5. Claim rewards or refunds" }),
        listItems: [
          t("Split Win rewards must be claimed during the active Quest window before all slots are taken.", {
            defaultValue:
              "Split Win rewards must be claimed during the active Quest window before all slots are taken.",
          }),
          t(
            "In Max Actions, winners claim after results are finalized. If a Quest is cancelled or cannot start, eligible funds can be refunded.",
            {
              defaultValue:
                "In Max Actions, winners claim after results are finalized. If a Quest is cancelled or cannot start, eligible funds can be refunded.",
            },
          ),
        ],
      },
    ],
    [t],
  )

  return <InfoStepsCard steps={steps} isOpen={isOpen} onClose={onClose} />
}
