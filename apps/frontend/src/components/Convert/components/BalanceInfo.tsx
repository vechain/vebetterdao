import { B3TRIcon, VOT3Icon } from "@/components/Icons"
import { HStack, VStack, Text } from "@chakra-ui/react"
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
    return isB3TR ? <B3TRIcon boxSize={"32px"} /> : <VOT3Icon boxSize={"32px"} />
  }, [isB3TR])

  const bgColor = useMemo(() => {
    return isB3TR ? "banner.blue" : "banner.green"
  }, [isB3TR])

  return (
    <VStack bg={bgColor} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"} align="center">
      <HStack>
        {image}
        <Text textStyle="xl" fontWeight="semibold">
          {compactFormatter.format(Number(balanceScaled))}
        </Text>
      </HStack>
      <Text textStyle="xs">{title}</Text>
    </VStack>
  )
}
