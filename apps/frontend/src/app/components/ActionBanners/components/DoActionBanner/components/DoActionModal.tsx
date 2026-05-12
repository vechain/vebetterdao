import { UseDisclosureProps, VStack, Heading, Text, Image, Button, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"
import { LuZap } from "react-icons/lu"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { VotingRequirementsList } from "@/app/components/OnboardingCard/VotingRequirementsList"
import { BaseModal } from "@/components/BaseModal"
import { PowerUpModal } from "@/components/PowerUpModal"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

type Variant = "new" | "returning"

type Props = {
  doActionModal: UseDisclosureProps
  variant?: Variant
}

export const DoActionModal = ({ doActionModal, variant = "returning" }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { isPerson } = useCanUserVote()
  const { missingActions } = useUserScore()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { data: voteBalance } = useGetVot3Balance(account?.address)
  const powerUpModal = useDisclosure()

  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const hasEnoughActions = isPerson ?? missingActions <= 0
  const hasB3trToConvert = Number(b3trBalance?.scaled ?? "0") >= 1
  const holdsAtLeastOneVot3 = Number(voteBalance?.scaled ?? "0") >= 1
  const allStepsComplete = hasEnoughActions && holdsAtLeastOneVot3

  const primaryAction = allStepsComplete
    ? null
    : !hasEnoughActions
      ? { label: t("Explore apps"), onClick: goToApps, icon: <IoGridOutline /> }
      : hasB3trToConvert && !holdsAtLeastOneVot3
        ? { label: t("Power up"), onClick: powerUpModal.onOpen, icon: <LuZap /> }
        : { label: t("Explore apps"), onClick: goToApps, icon: <IoGridOutline /> }

  const isNew = variant === "new"

  const heading = isNew ? t("Get ready to vote next round") : t("Verify you're a real person to vote this round")
  const body = isNew
    ? t(
        "Voting eligibility is determined by a snapshot of your voting power taken when each round opens. You didn't have enough VOT3 at the last snapshot, but you can prepare for the next round now.",
      )
    : t(
        "You have voting power for this round, but VeBetterDAO needs to verify you're a real person by counting your Better Actions. Complete a few more and your vote will unlock.",
      )
  const footnote = isNew
    ? t("Once all steps are complete, you'll be eligible automatically when the next round starts.")
    : t("Actions you complete during this round still count — there's still time.")
  const mascotSrc = isNew
    ? "/assets/mascot/mascot-welcoming-left-head-2.png"
    : "/assets/mascot/mascot-warning-head.webp"

  return (
    <BaseModal isOpen={doActionModal.open || false} onClose={doActionModal.onClose || (() => {})} showCloseButton>
      <VStack align="stretch" gap="4">
        <Image src={mascotSrc} alt="B3MO" boxSize="120px" objectFit="contain" alignSelf="center" />
        <VStack align="stretch" gap="2">
          <Heading size="2xl" fontWeight="bold">
            {heading}
          </Heading>
          <Text color="text.subtle">{body}</Text>
        </VStack>
        <VotingRequirementsList isPerson={isPerson} />
        <Text textStyle="sm" color="text.subtle">
          {footnote}
        </Text>
        {primaryAction && (
          <Button w="full" variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}
      </VStack>
      <PowerUpModal isOpen={powerUpModal.open} onClose={powerUpModal.onClose} />
    </BaseModal>
  )
}
