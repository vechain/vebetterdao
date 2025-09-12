import { AppVotesGiven, useIpfsImage, useXAppMetadata } from "@/api"
import { notFoundImage } from "@/constants"
import { Button, HStack, Skeleton, Text, VStack, Image, Card } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

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
    <Button
      h="auto"
      p="12px"
      display={"flex"}
      alignItems={"stretch"}
      variant="outline"
      border="none"
      asChild
      onClick={goToApp}>
      <Card.Root variant="base" w={"full"} borderRadius={12} justifyContent={"space-between"} p={{ base: 3, md: 4 }}>
        <Card.Body p={0} flexDirection={"row"} alignItems={"stretch"} justifyContent={"space-between"}>
          <HStack gap={2}>
            <Skeleton loading={isLogoLoading} boxSize={["48px", "48px", "48px"]}>
              <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
            </Skeleton>
            <Text textStyle="sm" fontWeight="semibold">
              {appVoted.appName}
            </Text>
          </HStack>
          <VStack justifyContent={"center"} alignContent={"center"} gap={0}>
            <HStack>
              <Image src="/assets/logos/vot3_logo_dark.svg" alt="Vot3" w="19px" h="19px" />
              <Text textStyle="xl" fontWeight="bold">
                {compactFormatter.format(appVoted.votes)}
              </Text>
            </HStack>
            <Text color="text.subtle" textStyle="xs">
              {t("Total assigned")}
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Button>
  )
}
