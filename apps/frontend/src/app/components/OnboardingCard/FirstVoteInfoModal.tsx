import { Button, Heading, HStack, Icon, Text, UseDisclosureProps, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass, LuGift, LuScale, LuVote } from "react-icons/lu"

import { BaseModal } from "@/components/BaseModal"

type Props = {
  disclosure: UseDisclosureProps
}

export const FirstVoteInfoModal = ({ disclosure }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const onClose = useCallback(() => disclosure.onClose?.(), [disclosure])

  const goToNavigators = useCallback(() => {
    onClose()
    router.push("/navigators")
  }, [onClose, router])

  return (
    <BaseModal isOpen={disclosure.open || false} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap="5">
        <VStack align="stretch" gap="2">
          <Heading size="2xl" fontWeight="bold">
            {t("Why your vote matters")}
          </Heading>
          <Text color="text.subtle">
            {t(
              "VeBetterDAO is shaped by its voters. Each round you decide how B3TR rewards are distributed to sustainability apps — and you earn rewards just for taking part.",
            )}
          </Text>
        </VStack>

        <InfoSection
          icon={<LuVote />}
          title={t("Shape where rewards go")}
          body={t(
            "Every round, the DAO splits B3TR rewards across registered sustainability apps. Your votes set the share each app receives, so the apps you support get more funding to grow their impact.",
          )}
        />
        <InfoSection
          icon={<LuGift />}
          title={t("Earn voter rewards")}
          body={t(
            "Voting isn't only governance — every vote you cast also earns you B3TR voter rewards, paid automatically at the end of the round.",
          )}
        />
        <InfoSection
          icon={<LuCompass />}
          title={t("Not sure who to vote for?")}
          body={t(
            "Delegate your voting power to a Navigator — a trusted voter who casts on your behalf. You still earn the same voter rewards while they make the decisions.",
          )}
        />
        <InfoSection
          icon={<LuScale />}
          title={t("Vote on both for the full reward")}
          body={t(
            "Allocation rounds decide app funding. Governance proposals decide the rules of the DAO. Skipping either means smaller voter rewards.",
          )}
        />

        <VStack gap="2" align="stretch" mt="2">
          <Button variant="primary" onClick={onClose}>
            {t("Got it")}
          </Button>
          <Button variant="link" onClick={goToNavigators}>
            {t("Find a Navigator")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}

const InfoSection = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <HStack align="flex-start" gap="3">
    <Icon asChild color="status.positive.strong" boxSize="6" flexShrink={0} mt="0.5">
      {icon}
    </Icon>
    <VStack align="stretch" gap="1">
      <Text fontWeight="semibold">{title}</Text>
      <Text color="text.subtle" textStyle="sm">
        {body}
      </Text>
    </VStack>
  </HStack>
)
