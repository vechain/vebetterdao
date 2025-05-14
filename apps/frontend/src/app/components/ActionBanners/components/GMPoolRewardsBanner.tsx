import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { Flex, Image } from "@chakra-ui/react"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export type Props = {
  currentRoundId: number
  gmImage: string
  notAGalaxyMember: boolean
}

const docsUrl = "https://docs.vebetterdao.org/vebetterdao/voter-rewards"

export const GMPoolRewardsBanner = ({ currentRoundId, gmImage, notAGalaxyMember }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const goToGalaxyMemberPage = useCallback(() => {
    if (notAGalaxyMember) {
      window.open(docsUrl, "_blank")
    } else {
      router.push(`/galaxy-member`)
    }
  }, [notAGalaxyMember, router])

  return (
    <GenericBanner
      title={currentRoundId == 45 ? t("GM REWARDS POOL IS LIVE FROM ROUND 46 💰") : t("GM REWARDS POOL IS LIVE 💰")}
      descriptionColor="#0A1C42"
      titleColor="#3A5798"
      description={t("Upgrade for less. Earn more with a higher GM level!")}
      logoSrc={
        <Flex position="relative" w="20" h="20" rounded="full" overflow={"hidden"} flexShrink={0}>
          <Image src={gmImage} alt={gmImage} w="full" h="full" position={"absolute"} />
          <Flex w="full" h="full" align="center" justify="center" bg={"rgba(0, 0, 0, 0.2)"} zIndex={1} />
        </Flex>
      }
      backgroundColor="#B1F16C"
      backgroundImageSrc="/images/community-green-blob.png"
      buttonIconPosition="right"
      buttonLabel={notAGalaxyMember ? t("Learn More") : t("Upgrade your GM")}
      onButtonClick={goToGalaxyMemberPage}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight color="white" />}
    />
  )
}
