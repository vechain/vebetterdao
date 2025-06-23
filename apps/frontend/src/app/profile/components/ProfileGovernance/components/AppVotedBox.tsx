import { AppVotesGiven, useIpfsImage } from "@/api"
import { notFoundImage } from "@/constants"
import { HStack, Skeleton, Text, VStack, Image } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useXAppMetadata } from "@vechain/vechain-kit"

type Props = {
  appVoted: AppVotesGiven
}

const compactFormatter = getCompactFormatter(0)

export const AppVotedBox = ({ appVoted }: Props) => {
  const router = useRouter()

  const { t } = useTranslation()

  const { data: appMetadata } = useXAppMetadata(appVoted.appId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const goToApp = useCallback(() => {
    router.push(`/apps/${appVoted.appId}`)
  }, [router, appVoted.appId])

  return (
    <HStack
      onClick={goToApp}
      w={"full"}
      borderRadius={12}
      cursor={"pointer"}
      bg={"profile-bg"}
      justifyContent={"space-between"}
      _hover={{
        bg: "hover-contrast-bg",
      }}
      p={{ base: 3, md: 4 }}>
      <HStack spacing={2}>
        <Skeleton isLoaded={!isLogoLoading} boxSize={["48px", "48px", "48px"]}>
          <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
        </Skeleton>
        <Text fontSize={14} fontWeight={"600"}>
          {appVoted.appName}
        </Text>
      </HStack>
      <VStack justifyContent={"center"} alignContent={"center"} spacing={0}>
        <HStack>
          <Image src="/assets/logos/vot3_logo_dark.svg" alt="Vot3" w="19px" h="19px" />
          <Text fontSize={20} fontWeight={"700"}>
            {compactFormatter.format(appVoted.votes)}
          </Text>
        </HStack>
        <Text color="#6A6A6A" fontSize={12} fontWeight={400}>
          {t("Total assigned")}
        </Text>
      </VStack>
    </HStack>
  )
}
