import { Card, HStack, Box, Image, Text } from "@chakra-ui/react"
import { t } from "i18next"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Trans } from "react-i18next"
import { AddressButton } from "../AddressButton"
import { AddressIcon } from "../AddressIcon"
import { useVechainDomain } from "@vechain/vechain-kit"

export type LeaderboardRanking = {
  position: number
  address: string
  score: number
}
type LeaderboardRankingComponentProps = {
  ranking: LeaderboardRanking
  isYourRanking?: boolean
}
export const LeaderboardRankingComponent = ({ ranking, isYourRanking }: LeaderboardRankingComponentProps) => {
  const { data: vnsData } = useVechainDomain(ranking.address)
  const domain = vnsData?.domain
  const router = useRouter()

  const onClick = () => {
    router.push(`/profile/${ranking.address}`)
  }

  const positionStyles = useMemo(() => {
    if (ranking.position === 1)
      return {
        text: "🥇",
        borderColor: "#FFD700",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(255, 215, 0, 0.4)",
      }
    if (ranking.position === 2)
      return {
        text: "🥈",
        borderColor: "#C0C0C0",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(192, 192, 192, 0.4)",
      }
    if (ranking.position === 3)
      return {
        text: "🥉",
        borderColor: "#CD7F32",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(205, 127, 50, 0.4)",
      }
    return {
      text: `#${ranking.position}`,
      borderColor: "#EFEFEF",
      fontSize: "xl",
      boxShadow: "0px 0px 5px 0px rgba(0, 0, 0, 0.1)",
    }
  }, [ranking.position])

  const whiteColor = isYourRanking ? "white" : "auto"
  const grayColor = isYourRanking ? "white" : "#6A6A6A"

  return (
    <Card.Root
      onClick={onClick}
      _hover={{
        cursor: "pointer",
        bg: isYourRanking ? "your-ranking-hover" : "hover-contrast-bg",
        transition: "all 0.2s",
      }}
      boxShadow={positionStyles.boxShadow}
      variant={"baseWithBorder"}
      {...(isYourRanking && { bg: "#004CFC" })}
      pos="relative"
      overflow={"hidden"}
      borderColor={positionStyles.borderColor}>
      <Card.Body color={whiteColor} p="12px">
        {isYourRanking && (
          <Image
            src="/assets/backgrounds/your-ranking-bg.svg"
            alt="Bg image"
            zIndex={0}
            rounded={"full"}
            pos="absolute"
            right={-7}
            top={"50%"}
            h="full"
            transform={"translateY(-50%)"}
            aria-label="Bg image"
          />
        )}
        <HStack w="full" justify="space-between">
          <HStack gap={2} zIndex={1}>
            <AddressIcon address={ranking.address} boxSize={8} minW={8} minH={8} rounded={"full"} />
            <Box>
              <HStack gap={1}>
                {isYourRanking && (
                  <Text textStyle="sm" fontWeight={600}>
                    {`(${t("You")})`}
                  </Text>
                )}

                {domain && (
                  <Text textStyle="md" fontWeight={600} h="auto" colorPalette={"gray"}>
                    {domain}
                  </Text>
                )}
                {!domain && (
                  <AddressButton
                    unstyled
                    textStyle="sm"
                    fontWeight={600}
                    h="auto"
                    address={ranking.address}
                    size={"sm"}
                    onClick={e => e.preventDefault()}
                    showAddressIcon={false}
                    showCopyIcon={false}
                    padding={0}
                    digitsBeforeEllipsis={5}
                    digitsAfterEllipsis={3}
                  />
                )}
              </HStack>

              <Text textStyle="sm" color={grayColor}>
                <Trans i18nKey="{{value}} actions" values={{ value: ranking.score }} />
              </Text>
            </Box>
          </HStack>
          {ranking.position !== 0 && (
            <Text fontSize={positionStyles.fontSize} fontWeight={600} zIndex={1}>
              {positionStyles.text}
            </Text>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
