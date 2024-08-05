import { HStack, VStack, Text, Image } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isB3TR: boolean
  balanceScaled: string
}

const compactFormatter = getCompactFormatter(4)

export const BalanceInfo = ({ isB3TR, balanceScaled }: Props) => {
  const { t } = useTranslation()

  const title = useMemo(() => {
    return isB3TR ? t("Current B3TR Balance") : t("Current VOT3 Balance")
  }, [isB3TR, t])

  const image = useMemo(() => {
    return isB3TR ? "/images/logo/b3tr_logo_dark.svg" : "/images/logo/vot3_logo_dark.svg"
  }, [isB3TR])

  const bgColor = useMemo(() => {
    return isB3TR ? "#E5EEFF" : "#E3FFC4"
  }, [isB3TR])

  return (
    <VStack bg={bgColor} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"} align="center">
      <HStack>
        <Image src={image} boxSize={"20px"} alt="B3TR Icon" />
        <Text fontSize={20} fontWeight={500} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          {compactFormatter.format(Number(balanceScaled))}
        </Text>
      </HStack>
      <Text fontSize="12px" fontWeight="400">
        {title}
      </Text>
    </VStack>
  )
}
