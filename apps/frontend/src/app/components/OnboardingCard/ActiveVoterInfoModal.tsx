import { Button, Heading, HStack, Icon, Text, UseDisclosureProps, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { LuGift, LuRefreshCw, LuTrendingUp, LuVote } from "react-icons/lu"

import { BaseModal } from "@/components/BaseModal"

type Props = {
  disclosure: UseDisclosureProps
}

export const ActiveVoterInfoModal = ({ disclosure }: Props) => {
  const { t } = useTranslation()

  const onClose = useCallback(() => disclosure.onClose?.(), [disclosure])

  return (
    <BaseModal isOpen={disclosure.open || false} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap="5">
        <VStack align="stretch" gap="2">
          <Heading size="2xl" fontWeight="bold">
            {t("Your voting cycle")}
          </Heading>
          <Text color="text.subtle">
            {t(
              "You've voted once — now you're in the regular cycle. Each round you can claim rewards, vote again, and grow your voting power.",
            )}
          </Text>
        </VStack>

        <InfoSection
          icon={<LuGift />}
          title={t("Claim your rewards")}
          body={t(
            "Every round you voted earns you B3TR voter rewards. Claim them whenever you're ready — they don't expire.",
          )}
        />
        <InfoSection
          icon={<LuVote />}
          title={t("Vote every round")}
          body={t(
            "Each new round opens a fresh allocation vote. Cast it to keep earning and keep shaping where B3TR rewards go.",
          )}
        />
        <InfoSection
          icon={<LuTrendingUp />}
          title={t("Grow your power")}
          body={t(
            "The more VOT3 you hold at the next round's snapshot, the more weight your vote carries — and the bigger your voter rewards.",
          )}
        />
        <InfoSection
          icon={<LuRefreshCw />}
          title={t("Stay eligible")}
          body={t(
            "Complete at least one Better Action each round to keep your voting eligibility rolling into the next round.",
          )}
        />

        <Button variant="primary" onClick={onClose} mt="2">
          {t("Got it")}
        </Button>
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
