import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useCurrentAllocationsRoundId } from "@/api"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export const CastVoteBanner = () => {
  const { t } = useTranslation()
  const { data: roundId } = useCurrentAllocationsRoundId()

  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")

  const router = useRouter()
  const handleVote = useCallback(() => {
    router.push(`/rounds/${roundId}/vote`)
  }, [router, roundId])

  return (
    <Card bg="#B1F16C" borderRadius="xl" w="full">
      <CardBody position="relative" overflow="hidden" borderRadius="xl" padding={{ base: 4, md: 6 }}>
        <Image
          src="/images/community-green-blob.png"
          alt="cloud-background"
          position="absolute"
          right={["-50%", "-50%", "-10%"]}
          top={["-50%", "-50%", "-150%"]}
        />
        <Show above="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <Image src="/images/vote-icon.png" alt="Vote" w={24} h={24} />
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color="#3A5798" fontWeight="600">
                  {t("CAST YOUR VOTE NOW! ⚖️")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#0C2D75">
                  {t("It’s time to make your voice heard in this round and earn exciting rewards!")}
                </Heading>
              </VStack>
              <Button
                variant="primaryAction"
                onClick={handleVote}
                borderRadius="full"
                rightIcon={<UilArrowRight color="white" />}>
                <Text fontWeight="500">{t("See round")}</Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full" alignItems={"center"}>
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text fontSize={12} color="#3A5798" fontWeight="600">
                {t("CAST YOUR VOTE NOW! ⚖️")}
              </Text>
              <Heading fontSize="18" fontWeight="700" color="#0C2D75">
                {t("It’s time to make your voice heard in this round and earn exciting rewards!")}
              </Heading>
              <Button
                variant="primaryAction"
                onClick={handleVote}
                borderRadius="full"
                rightIcon={<UilArrowRight color="white" />}>
                <Text fontWeight="500">{t("See round")}</Text>
              </Button>
            </VStack>
            <Image
              src="/images/vote-icon.png"
              alt="Vote"
              w={isVerySmallMobile ? 16 : 24}
              h={isVerySmallMobile ? 16 : 24}
            />
          </HStack>
        </Show>
      </CardBody>
    </Card>
  )
}
