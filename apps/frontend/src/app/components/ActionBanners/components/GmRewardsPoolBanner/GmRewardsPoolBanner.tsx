import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { Flex, Image } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export type Props = {
  b3trLeftover: number
  gmImage: string
  notAGalaxyMember: boolean
}

export const GmRewardsPoolBanner = ({ b3trLeftover, gmImage, notAGalaxyMember }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const goToGalaxyMemberPage = useCallback(() => {
    router.push(`/galaxy-member`)
  }, [router])

  const amount = FormattingUtils.humanNumber(b3trLeftover)

  return (
    <GenericBanner
      title={t("GM REWARDS POOL AND UPGRADE IS LIVE 💰")}
      descriptionColor="#0A1C42"
      titleColor="#3A5798"
      description={
        b3trLeftover > 0
          ? t(
              "You have {{value}} B3TR left over from the previous upgrade. Check out how many remains for your next GM!",
              { value: amount },
            )
          : t("GM upgrades went down! Check out what's new for Galaxy Members. (LINK TO DOCS)")
      }
      logoSrc={
        <Flex position="relative" w="20" h="20" rounded="full" overflow={"hidden"}>
          <Image src={gmImage} alt={gmImage} w="20" h="20" position={"absolute"} />
          <Flex w="full" h="full" align="center" justify="center" bg={"rgba(0, 0, 0, 0.2)"} zIndex={1} />
        </Flex>
      }
      backgroundColor="#B1F16C"
      backgroundImageSrc="/images/community-green-blob.png"
      buttonIconPosition="right"
      buttonLabel={t("Your Galaxy Member")}
      onButtonClick={goToGalaxyMemberPage}
      buttonVariant="primaryAction"
      disabled={notAGalaxyMember}
      buttonIcon={<UilArrowRight color="white" />}
    />
  )
}
